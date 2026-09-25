import { NextFunction, Request, Response } from 'express';
import { examinationCourseService } from '../services/examinationCourseService';

export const addExaminationCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examinationCourse = await examinationCourseService.addCourse(
      String(req.params.examId),
      String(req.body.courseId),
    );
    res.status(201).json({ success: true, data: examinationCourse });
  } catch (error) {
    next(error);
  }
};

export const listExaminationCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examinationCourses = await examinationCourseService.listCourses(String(req.params.examId));
    res.status(200).json({ success: true, data: examinationCourses });
  } catch (error) {
    next(error);
  }
};