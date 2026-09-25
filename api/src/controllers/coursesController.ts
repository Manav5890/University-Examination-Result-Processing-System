import { NextFunction, Request, Response } from 'express';
import { courseService } from '../services/courseService';

export const createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const listCourses = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courses = await courseService.listCourses();
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courseId = String(req.params.id);
    const course = await courseService.getCourseById(courseId);
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};
