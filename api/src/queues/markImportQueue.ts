import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
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
  const content = await readFile(data.filePath, 'utf8');
  const rows = content.split(/\r?\n/).filter(Boolean);
  const dataRows = rows[0]?.toLowerCase().includes('examid') ? rows.slice(1) : rows;
  let successful = 0;
  let failed = 0;

  await importJobRepository.updateProgress(data.importJobId, { total: dataRows.length });

  for (const row of dataRows) {
    const [examId, studentId, courseId, componentId, value] = row.split(',').map((item) => item.trim());
    try {
      await markService.createMark({ examId, studentId, courseId, componentId, value: Number(value) });
      successful += 1;
    } catch {
      failed += 1;
    }
    await importJobRepository.updateProgress(data.importJobId, {
      processed: successful + failed,
      successful,
      failed,
    });
  }

  await importJobRepository.updateProgress(data.importJobId, {
    status: 'COMPLETED',
    processed: successful + failed,
  });
  await unlink(data.filePath).catch(() => undefined);
}