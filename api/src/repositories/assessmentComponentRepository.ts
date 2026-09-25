export type AssessmentComponentRecord = {
  id: string;
  courseId: string;
  name: string;
  maxMarks: number;
  weightage: number;
  createdAt: Date;
  updatedAt: Date;
};

const assessmentComponents: AssessmentComponentRecord[] = [];

export const assessmentComponentRepository = {
  findManyByCourseId: async (courseId: string): Promise<AssessmentComponentRecord[]> =>
    assessmentComponents.filter((component) => component.courseId === courseId),

  findByCourseAndName: async (courseId: string, name: string): Promise<AssessmentComponentRecord | undefined> =>
    assessmentComponents.find((component) => component.courseId === courseId && component.name === name),

  create: async (
    data: Omit<AssessmentComponentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AssessmentComponentRecord> => {
    const now = new Date();
    const item: AssessmentComponentRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    assessmentComponents.push(item);
    return item;
  },
};