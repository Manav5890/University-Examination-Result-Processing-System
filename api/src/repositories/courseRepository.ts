import { prisma } from '../config/database';

export type CourseRecord = {
  id: string;
  code: string;
  name: string;
  maxMarks: number;
  programmeId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const courseRepository = {
  findMany: async (): Promise<CourseRecord[]> => prisma.course.findMany(),

  findById: async (id: string): Promise<CourseRecord | undefined> => (await prisma.course.findUnique({ where: { id } })) ?? undefined,

  findByCode: async (code: string): Promise<CourseRecord | undefined> => (await prisma.course.findUnique({ where: { code } })) ?? undefined,

  create: async (data: Omit<CourseRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseRecord> => prisma.course.create({ data }),
};
