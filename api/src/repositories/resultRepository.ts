export type ResultRecord = {
  id: string;
  examId: string;
  studentId: string;
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  grade: string;
  status: 'PASS' | 'FAIL';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const results: ResultRecord[] = [];

export const resultRepository = {
  findManyByExamId: async (examId: string): Promise<ResultRecord[]> =>
    results.filter((result) => result.examId === examId),

  upsert: async (
    data: Omit<ResultRecord, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>,
  ): Promise<ResultRecord> => {
    const existing = results.find(
      (result) => result.examId === data.examId && result.studentId === data.studentId,
    );
    const now = new Date();

    if (existing) {
      Object.assign(existing, data, { updatedAt: now });
      return existing;
    }

    const item: ResultRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    results.push(item);
    return item;
  },

  publishByExamId: async (examId: string): Promise<ResultRecord[]> => {
    const publishedAt = new Date();
    const examResults = results.filter((result) => result.examId === examId);
    examResults.forEach((result) => {
      result.publishedAt = publishedAt;
      result.updatedAt = publishedAt;
    });
    return examResults;
  },
};