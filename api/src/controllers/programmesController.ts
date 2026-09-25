import { NextFunction, Request, Response } from 'express';
import { programmeService } from '../services/programmeService';

export const createProgramme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const programme = await programmeService.createProgramme(req.body);
    res.status(201).json({ success: true, data: programme });
  } catch (error) {
    next(error);
  }
};

export const listProgrammes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const programmes = await programmeService.listProgrammes();
    res.status(200).json({ success: true, data: programmes });
  } catch (error) {
    next(error);
  }
};

export const getProgrammeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const programmeId = String(req.params.id);
    const programme = await programmeService.getProgrammeById(programmeId);
    res.status(200).json({ success: true, data: programme });
  } catch (error) {
    next(error);
  }
};
