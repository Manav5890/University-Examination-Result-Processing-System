import { Router } from 'express';
import { createMark, getBulkImportStatus, listMarks, queueBulkImport, updateMark } from '../controllers/marksController';

export const markRoutes = Router();

markRoutes.post('/', createMark);
markRoutes.put('/:id', updateMark);
markRoutes.get('/', listMarks);
markRoutes.post('/import', queueBulkImport);
markRoutes.get('/import/:jobId', getBulkImportStatus);
