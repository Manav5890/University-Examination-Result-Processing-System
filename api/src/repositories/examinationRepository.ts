import { prisma } from '../config/database';

export type ExaminationRecord = {
  id: string;
  name: string;
  semester: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: 'DRAFT' | 'ACTIVE' | 'PROCESSING' | 'CALCULATED' | 'PUBLISHED';
  createdAt: Date;
  updatedAt: Date;
};

export const examinationRepository = {
  findMany: async (): Promise<ExaminationRecord[]> => prisma.examination.findMany(),

  findById: async (id: string): Promise<ExaminationRecord | undefined> => (await prisma.examination.findUnique({ where: { id } })) ?? undefined,

  updateStatus: async (
    id: string,
    status: ExaminationRecord['status'],
  ): Promise<ExaminationRecord | undefined> => prisma.examination.update({ where: { id }, data: { status } }).catch(() => undefined),

  create: async (data: Omit<ExaminationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExaminationRecord> => prisma.examination.create({ data }),
};
