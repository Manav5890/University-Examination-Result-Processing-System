import { Router } from 'express';
import {
  createAssessmentComponent,
  listAssessmentComponents,
} from '../controllers/assessmentComponentsController';

export const assessmentComponentRoutes = Router();

assessmentComponentRoutes.post('/courses/:courseId/components', createAssessmentComponent);
assessmentComponentRoutes.get('/courses/:courseId/components', listAssessmentComponents);