export type ExaminationCourseRecord = {
  id: string;
  examinationId: string;
  courseId: string;
  createdAt: Date;
};

const examinationCourses: ExaminationCourseRecord[] = [];

export const examinationCourseRepository = {
  findManyByExaminationId: async (examinationId: string): Promise<ExaminationCourseRecord[]> =>
    examinationCourses.filter((item) => item.examinationId === examinationId),

  findByExaminationAndCourse: async (
    examinationId: string,
    courseId: string,
  ): Promise<ExaminationCourseRecord | undefined> =>
    examinationCourses.find((item) => item.examinationId === examinationId && item.courseId === courseId),

  create: async (
    data: Omit<ExaminationCourseRecord, 'id' | 'createdAt'>,
  ): Promise<ExaminationCourseRecord> => {
    const item: ExaminationCourseRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };

    examinationCourses.push(item);
    return item;
  },
};