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

const marks: MarkRecord[] = [];

export const markRepository = {
  findMany: async (): Promise<MarkRecord[]> => [...marks],

  findById: async (id: string): Promise<MarkRecord | undefined> =>
    marks.find((mark) => mark.id === id),

  findByExamStudentCourseComponent: async (
    examId: string,
    studentId: string,
    courseId: string,
    componentId: string,
  ): Promise<MarkRecord | undefined> =>
    marks.find(
      (mark) =>
        mark.examId === examId &&
        mark.studentId === studentId &&
        mark.courseId === courseId &&
        mark.componentId === componentId,
    ),

  findManyByExamStudent: async (examId: string, studentId: string): Promise<MarkRecord[]> =>
    marks.filter((mark) => mark.examId === examId && mark.studentId === studentId),

  create: async (data: Omit<MarkRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarkRecord> => {
    const now = new Date();
    const item: MarkRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    marks.push(item);
    return item;
  },

  updateById: async (id: string, value: number): Promise<MarkRecord | undefined> => {
    const index = marks.findIndex((mark) => mark.id === id);
    if (index === -1) {
      return undefined;
    }

    marks[index] = {
      ...marks[index],
      value,
      updatedAt: new Date(),
    };

    return marks[index];
  },
};
