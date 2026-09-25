import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import multer from 'multer';

const uploadDirectory = path.join(os.tmpdir(), 'university-exam-mark-imports');
fs.mkdirSync(uploadDirectory, { recursive: true });

export const markCsvUpload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const isCsv = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
    if (isCsv) {
      callback(null, true);
      return;
    }
    callback(new Error('Only CSV files are supported'));
  },
});