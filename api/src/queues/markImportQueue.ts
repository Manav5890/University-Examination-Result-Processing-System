import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { parse } from 'csv-parse';
import { PgBoss } from 'pg-boss';
import { env } from '../config/env';
import { importJobRepository } from '../repositories/importJobRepository';
import { markService } from '../services/markService';

const queueName = 'mark-import';
const boss = new PgBoss(env.DATABASE_URL);
let started: Promise<void> | undefined;

type MarkImportJob = {
  importJobId: string;
  filePath: string;
};

async function startQueue(): Promise<void> {
  if (!started) {
    started = (async () => {
      await boss.start();
      await boss.createQueue(queueName, {
        retryLimit: 3,
        retryDelay: 5,
        expireInSeconds: 3600,
      });
      await boss.work<MarkImportJob>(queueName, { batchSize: 1 }, async ([job]) => {
        try {
          await processImport(job.data);
        } catch (error) {
          await importJobRepository.updateProgress(job.data.importJobId, {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Import failed',
          });
          await unlink(job.data.filePath).catch(() => undefined);
          throw error;
        }
      });
    })();
  }

  await started;
}

export async function enqueueMarkImport(fileName: string, filePath: string): Promise<string> {
  await startQueue();
  const importJobId = randomUUID();
  await importJobRepository.create(importJobId, fileName);
  const queueJobId = await boss.send(queueName, { importJobId, filePath });
  if (!queueJobId) {
    throw new Error('Unable to enqueue mark import job');
  }
  return importJobId;
}

export async function getMarkImportStatus(importJobId: string) {
  return importJobRepository.findById(importJobId);
}

async function processImport(data: MarkImportJob): Promise<void> {
  await importJobRepository.updateProgress(data.importJobId, { status: 'PROCESSING' });
  const parser = createReadStream(data.filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }));
  let successful = 0;
  let failed = 0;
  let total = 0;

  for await (const row of parser) {
    total += 1;
    try {
      const record = row as Record<string, string>;
      await markService.createMark({
        examId: record.examId,
        studentId: record.studentId,
        courseId: record.courseId,
        componentId: record.componentId,
        value: Number(record.value),
      });
      successful += 1;
    } catch {
      failed += 1;
    }
    if (total % 500 === 0) {
      await importJobRepository.updateProgress(data.importJobId, { total, processed: total, successful, failed });
    }
  }

  await importJobRepository.updateProgress(data.importJobId, {
    status: 'COMPLETED',
    total,
    processed: total,
    successful,
    failed,
  });
  await unlink(data.filePath).catch(() => undefined);
}