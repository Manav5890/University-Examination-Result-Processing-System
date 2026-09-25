import { NextFunction, Request, Response } from 'express';
import { examinationService } from '../services/examinationService';

export const createExamination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examination = await examinationService.createExamination(req.body);
    res.status(201).json({ success: true, data: examination });
  } catch (error) {
    next(error);
  }
};

export const listExaminations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examinations = await examinationService.listExaminations();
    res.status(200).json({ success: true, data: examinations });
  } catch (error) {
    next(error);
  }
};

export const getExaminationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examinationId = String(req.params.id);
    const examination = await examinationService.getExaminationById(examinationId);
    res.status(200).json({ success: true, data: examination });
  } catch (error) {
    next(error);
  }
};
