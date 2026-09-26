import { prisma } from '../config/database';

export type AssessmentComponentRecord = {
  id: string;
  courseId: string;
  name: string;
  maxMarks: number;
  weightage: number;
};

export const assessmentComponentRepository = {
  findManyByCourseId: async (courseId: string): Promise<AssessmentComponentRecord[]> =>
    prisma.assessmentComponent.findMany({ where: { courseId } }),

  findByCourseAndName: async (courseId: string, name: string): Promise<AssessmentComponentRecord | undefined> =>
    (await prisma.assessmentComponent.findUnique({ where: { courseId_name: { courseId, name } } })) ?? undefined,

  create: async (
    data: Omit<AssessmentComponentRecord, 'id'>,
  ): Promise<AssessmentComponentRecord> => prisma.assessmentComponent.create({ data }),
};