import { NextFunction, Request, Response } from 'express';
import { studentService } from '../services/studentService';

export const createStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

export const listStudents = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const students = await studentService.listStudents();
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = String(req.params.id);
    const student = await studentService.getStudentById(studentId);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};
