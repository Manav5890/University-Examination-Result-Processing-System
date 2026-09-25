import { Router } from 'express';
import { createCourse, getCourseById, listCourses } from '../controllers/coursesController';

export const courseRoutes = Router();

courseRoutes.post('/', createCourse);
courseRoutes.get('/', listCourses);
courseRoutes.get('/:id', getCourseById);
