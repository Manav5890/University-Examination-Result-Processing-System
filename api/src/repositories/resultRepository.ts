import { prisma } from '../config/database';

export type ResultRecord = {
  id: string;
  examId: string;
  studentId: string;
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  grade: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const resultRepository = {
  findManyByExamId: async (examId: string): Promise<ResultRecord[]> =>
    prisma.result.findMany({ where: { examId } }),

  upsert: async (
    data: Omit<ResultRecord, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>,
  ): Promise<ResultRecord> => prisma.result.upsert({
    where: { examId_studentId: { examId: data.examId, studentId: data.studentId } },
    create: { ...data, publishedAt: null },
    update: data,
  }),

  publishByExamId: async (examId: string): Promise<ResultRecord[]> => {
    await prisma.result.updateMany({ where: { examId }, data: { publishedAt: new Date() } });
    return prisma.result.findMany({ where: { examId } });
  },
};