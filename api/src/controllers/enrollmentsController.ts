import { NextFunction, Request, Response } from 'express';
import { enrollmentService } from '../services/enrollmentService';

export const enrollStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enrollment = await enrollmentService.enrollStudent({
      examId: String(req.params.examId),
      studentId: String(req.body.studentId),
      courseId: String(req.body.courseId),
    });
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const listEnrollments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enrollments = await enrollmentService.listEnrollments(String(req.params.examId));
    res.status(200).json({ success: true, data: enrollments });
  } catch (error) {
    next(error);
  }
};