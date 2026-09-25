import { Router } from 'express';
import { createMark, getBulkImportStatus, listMarks, queueBulkImport, updateMark } from '../controllers/marksController';
import { markCsvUpload } from '../middleware/upload';

export const markRoutes = Router();

markRoutes.post('/', createMark);
markRoutes.put('/:id', updateMark);
markRoutes.get('/', listMarks);
markRoutes.post('/import', markCsvUpload.single('file'), queueBulkImport);
markRoutes.get('/import/:jobId', getBulkImportStatus);
