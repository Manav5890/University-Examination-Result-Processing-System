export type StudentRecord = {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  programmeId: string;
  createdAt: Date;
  updatedAt: Date;
};

const students: StudentRecord[] = [];

export const studentRepository = {
  findMany: async (): Promise<StudentRecord[]> => [...students],

  findById: async (id: string): Promise<StudentRecord | undefined> =>
    students.find((student) => student.id === id),

  findByRollNumber: async (rollNumber: string): Promise<StudentRecord | undefined> =>
    students.find((student) => student.rollNumber === rollNumber),

  create: async (data: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentRecord> => {
    const now = new Date();
    const item: StudentRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    students.push(item);
    return item;
  },
};
