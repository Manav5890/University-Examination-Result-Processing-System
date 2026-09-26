import { prisma } from '../config/database';

export type MarkRecord = {
  id: string;
  examId: string;
  studentId: string;
  courseId: string;
  componentId: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
};

export const markRepository = {
  findMany: async (): Promise<MarkRecord[]> => prisma.mark.findMany(),

  findById: async (id: string): Promise<MarkRecord | undefined> => (await prisma.mark.findUnique({ where: { id } })) ?? undefined,

  findByExamStudentCourseComponent: async (
    examId: string,
    studentId: string,
    courseId: string,
    componentId: string,
  ): Promise<MarkRecord | undefined> => (await prisma.mark.findUnique({ where: { examId_studentId_courseId_componentId: { examId, studentId, courseId, componentId } } })) ?? undefined,

  findManyByExamStudent: async (examId: string, studentId: string): Promise<MarkRecord[]> =>
    prisma.mark.findMany({ where: { examId, studentId } }),

  create: async (data: Omit<MarkRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarkRecord> => prisma.mark.create({ data }),

  updateById: async (id: string, value: number): Promise<MarkRecord | undefined> => prisma.mark.update({ where: { id }, data: { value } }).catch(() => undefined),
};
