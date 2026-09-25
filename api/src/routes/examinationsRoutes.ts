import { Router } from 'express';
import { createExamination, getExaminationById, listExaminations } from '../controllers/examinationsController';

export const examinationRoutes = Router();

examinationRoutes.post('/', createExamination);
examinationRoutes.get('/', listExaminations);
examinationRoutes.get('/:id', getExaminationById);
