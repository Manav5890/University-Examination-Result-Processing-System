import { prisma } from '../config/database';

export type ProgrammeRecord = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const programmeRepository = {
  findMany: async (): Promise<ProgrammeRecord[]> => prisma.programme.findMany(),

  findById: async (id: string): Promise<ProgrammeRecord | undefined> => (await prisma.programme.findUnique({ where: { id } })) ?? undefined,

  create: async (data: Omit<ProgrammeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgrammeRecord> => prisma.programme.create({ data: { ...data, description: data.description ?? null } }),
};
