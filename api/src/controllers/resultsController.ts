import { NextFunction, Request, Response } from 'express';
import { resultService } from '../services/resultService';

export const calculateResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await resultService.calculateResults(String(req.params.examId));
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const publishResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await resultService.publishResults(String(req.params.examId));
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const listResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await resultService.listResults(String(req.params.examId));
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};