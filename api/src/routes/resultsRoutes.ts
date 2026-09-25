import { Router } from 'express';
import { calculateResults, listResults, publishResults } from '../controllers/resultsController';

export const resultRoutes = Router();

resultRoutes.post('/examinations/:examId/results/calculate', calculateResults);
resultRoutes.post('/examinations/:examId/results/publish', publishResults);
resultRoutes.get('/examinations/:examId/results', listResults);