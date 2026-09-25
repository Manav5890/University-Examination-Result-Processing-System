import { NextFunction, Request, Response } from 'express';
import { markService } from '../services/markService';
import { enqueueMarkImport, getMarkImportStatus } from '../queues/markImportQueue';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export const createMark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mark = await markService.createMark({
      ...req.body,
      value: Number(req.body.value),
    });
    res.status(201).json({ success: true, data: mark });
  } catch (error) {
    next(error);
  }
};

export const updateMark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const markId = String(req.params.id);
    const mark = await markService.updateMark(markId, Number(req.body.value));
    res.status(200).json({ success: true, data: mark });
  } catch (error) {
    next(error);
  }
};

export const listMarks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const marks = await markService.listMarks();
    res.status(200).json({ success: true, data: marks });
  } catch (error) {
    next(error);
  }
};

export const queueBulkImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fileName = String(req.body.fileName ?? 'marks.csv');
    const csvContent = String(req.body.csvContent ?? '');
    if (!csvContent.trim()) {
      res.status(400).json({ success: false, error: { message: 'csvContent is required' } });
      return;
    }

    const filePath = path.join('/tmp', `marks-${randomUUID()}.csv`);
    await writeFile(filePath, csvContent, 'utf8');
    const jobId = await enqueueMarkImport(fileName, filePath);
    res.status(202).json({ success: true, data: { jobId, status: 'QUEUED' } });
  } catch (error) {
    next(error);
  }
};

export const getBulkImportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await getMarkImportStatus(String(req.params.jobId));
    if (!job) {
      res.status(404).json({ success: false, error: { message: 'Import job not found' } });
      return;
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

