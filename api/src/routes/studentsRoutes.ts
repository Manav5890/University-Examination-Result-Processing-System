import { Router } from 'express';
import { createStudent, getStudentById, listStudents } from '../controllers/studentsController';

export const studentRoutes = Router();

studentRoutes.post('/', createStudent);
studentRoutes.get('/', listStudents);
studentRoutes.get('/:id', getStudentById);
