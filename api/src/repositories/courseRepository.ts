export type CourseRecord = {
  id: string;
  code: string;
  name: string;
  maxMarks: number;
  programmeId: string;
  createdAt: Date;
  updatedAt: Date;
};

const courses: CourseRecord[] = [];

export const courseRepository = {
  findMany: async (): Promise<CourseRecord[]> => [...courses],

  findById: async (id: string): Promise<CourseRecord | undefined> =>
    courses.find((course) => course.id === id),

  findByCode: async (code: string): Promise<CourseRecord | undefined> =>
    courses.find((course) => course.code === code),

  create: async (data: Omit<CourseRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseRecord> => {
    const now = new Date();
    const item: CourseRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    courses.push(item);
    return item;
  },
};
