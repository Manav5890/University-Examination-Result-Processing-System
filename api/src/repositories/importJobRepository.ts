import { prisma } from '../config/database';

export type ImportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

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

export const importJobRepository = {
  async create(id: string, fileName: string): Promise<ImportJobRecord> {
    return prisma.importJob.create({ data: { id, fileName, status: 'QUEUED' } }) as Promise<ImportJobRecord>;
  },

  async findById(id: string): Promise<ImportJobRecord | undefined> {
    return (await prisma.importJob.findUnique({ where: { id } })) as ImportJobRecord | null ?? undefined;
  },

  async updateProgress(
    id: string,
    values: Partial<Pick<ImportJobRecord, 'status' | 'total' | 'processed' | 'successful' | 'failed' | 'errorMessage'>>,
  ): Promise<void> {
    await prisma.importJob.update({ where: { id }, data: values });
  },
};