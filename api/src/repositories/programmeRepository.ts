export type ProgrammeRecord = {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

const programmes: ProgrammeRecord[] = [];

export const programmeRepository = {
  findMany: async (): Promise<ProgrammeRecord[]> => [...programmes],

  findById: async (id: string): Promise<ProgrammeRecord | undefined> =>
    programmes.find((programme) => programme.id === id),

  create: async (data: Omit<ProgrammeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgrammeRecord> => {
    const now = new Date();
    const item: ProgrammeRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    programmes.push(item);
    return item;
  },
};
