import { Router } from 'express';
import { enrollStudent, listEnrollments } from '../controllers/enrollmentsController';

export const enrollmentRoutes = Router();

enrollmentRoutes.post('/examinations/:examId/enrollments', enrollStudent);
enrollmentRoutes.get('/examinations/:examId/enrollments', listEnrollments);