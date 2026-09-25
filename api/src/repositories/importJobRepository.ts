import { pool } from '../config/postgres';

export type ImportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ImportJobRecord = {
  id: string;
  fileName: string;
  status: ImportJobStatus;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errorMessage?: string;
};

let schemaReady: Promise<void> | undefined;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS import_jobs (
        id UUID PRIMARY KEY,
        file_name TEXT NOT NULL,
        status TEXT NOT NULL,
        total INTEGER NOT NULL DEFAULT 0,
        processed INTEGER NOT NULL DEFAULT 0,
        successful INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).then(() => undefined);
  }

  await schemaReady;
}

export const importJobRepository = {
  async create(id: string, fileName: string): Promise<ImportJobRecord> {
    await ensureSchema();
    const result = await pool.query(
      `INSERT INTO import_jobs (id, file_name, status)
       VALUES ($1, $2, 'QUEUED')
       RETURNING id, file_name, status, total, processed, successful, failed, error_message`,
      [id, fileName],
    );
    return mapRow(result.rows[0]);
  },

  async findById(id: string): Promise<ImportJobRecord | undefined> {
    await ensureSchema();
    const result = await pool.query(
      `SELECT id, file_name, status, total, processed, successful, failed, error_message
       FROM import_jobs WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : undefined;
  },

  async updateProgress(
    id: string,
    values: Partial<Pick<ImportJobRecord, 'status' | 'total' | 'processed' | 'successful' | 'failed' | 'errorMessage'>>,
  ): Promise<void> {
    await ensureSchema();
    await pool.query(
      `UPDATE import_jobs
       SET status = COALESCE($2, status), total = COALESCE($3, total),
           processed = COALESCE($4, processed), successful = COALESCE($5, successful),
           failed = COALESCE($6, failed), error_message = COALESCE($7, error_message),
           updated_at = NOW()
       WHERE id = $1`,
      [id, values.status ?? null, values.total ?? null, values.processed ?? null, values.successful ?? null, values.failed ?? null, values.errorMessage ?? null],
    );
  },
};

function mapRow(row: Record<string, unknown>): ImportJobRecord {
  return {
    id: String(row.id),
    fileName: String(row.file_name),
    status: row.status as ImportJobStatus,
    total: Number(row.total),
    processed: Number(row.processed),
    successful: Number(row.successful),
    failed: Number(row.failed),
    errorMessage: row.error_message ? String(row.error_message) : undefined,
  };
}