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

const examinations: ExaminationRecord[] = [];

export const examinationRepository = {
  findMany: async (): Promise<ExaminationRecord[]> => [...examinations],

  findById: async (id: string): Promise<ExaminationRecord | undefined> =>
    examinations.find((examination) => examination.id === id),

  updateStatus: async (
    id: string,
    status: ExaminationRecord['status'],
  ): Promise<ExaminationRecord | undefined> => {
    const examination = examinations.find((item) => item.id === id);
    if (!examination) {
      return undefined;
    }

    examination.status = status;
    examination.updatedAt = new Date();
    return examination;
  },

  create: async (data: Omit<ExaminationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExaminationRecord> => {
    const now = new Date();
    const item: ExaminationRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    examinations.push(item);
    return item;
  },
};
