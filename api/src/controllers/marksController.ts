import { NextFunction, Request, Response } from 'express';
import { markService } from '../services/markService';
import { cancelMarkImport, enqueueMarkImport, getMarkImportStatus } from '../queues/markImportQueue';

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
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'A CSV file is required in the file field' } });
      return;
    }

    const jobId = await enqueueMarkImport(req.file.originalname, req.file.path);
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

export const cancelBulkImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobId = String(req.params.jobId);
    await cancelMarkImport(jobId);
    res.status(200).json({ success: true, data: { jobId, status: 'CANCELLED' } });
  } catch (error) {
    next(error);
  }
};



