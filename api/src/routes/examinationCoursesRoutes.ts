import { Router } from 'express';
import {
  addExaminationCourse,
  listExaminationCourses,
} from '../controllers/examinationCoursesController';

export const examinationCourseRoutes = Router();

examinationCourseRoutes.post('/examinations/:examId/courses', addExaminationCourse);
examinationCourseRoutes.get('/examinations/:examId/courses', listExaminationCourses);