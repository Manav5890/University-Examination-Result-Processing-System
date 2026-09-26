import { prisma } from '../config/database';

export type StudentRecord = {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  programmeId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const studentRepository = {
  findMany: async (): Promise<StudentRecord[]> => prisma.student.findMany(),

  findById: async (id: string): Promise<StudentRecord | undefined> => (await prisma.student.findUnique({ where: { id } })) ?? undefined,

  findByRollNumber: async (rollNumber: string): Promise<StudentRecord | undefined> => (await prisma.student.findUnique({ where: { rollNumber } })) ?? undefined,

  create: async (data: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentRecord> => prisma.student.create({ data }),
};
