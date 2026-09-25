import { Router } from 'express';
import { createProgramme, getProgrammeById, listProgrammes } from '../controllers/programmesController';

export const programmeRoutes = Router();

programmeRoutes.post('/', createProgramme);
programmeRoutes.get('/', listProgrammes);
programmeRoutes.get('/:id', getProgrammeById);
