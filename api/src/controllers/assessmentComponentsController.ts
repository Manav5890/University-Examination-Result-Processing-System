import { NextFunction, Request, Response } from 'express';
import { assessmentComponentService } from '../services/assessmentComponentService';

export const createAssessmentComponent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const component = await assessmentComponentService.createComponent({
      courseId: String(req.params.courseId),
      ...req.body,
    });
    res.status(201).json({ success: true, data: component });
  } catch (error) {
    next(error);
  }
};

export const listAssessmentComponents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const components = await assessmentComponentService.listComponents(String(req.params.courseId));
    res.status(200).json({ success: true, data: components });
  } catch (error) {
    next(error);
  }
};