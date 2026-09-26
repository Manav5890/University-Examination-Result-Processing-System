import { prisma } from '../config/database';

export type ExaminationCourseRecord = {
  id: string;
  examinationId: string;
  courseId: string;
};

export const examinationCourseRepository = {
  findManyByExaminationId: async (examinationId: string): Promise<ExaminationCourseRecord[]> =>
    prisma.examinationCourse.findMany({ where: { examinationId } }),

  findByExaminationAndCourse: async (
    examinationId: string,
    courseId: string,
  ): Promise<ExaminationCourseRecord | undefined> => (await prisma.examinationCourse.findUnique({ where: { examinationId_courseId: { examinationId, courseId } } })) ?? undefined,

  create: async (
    data: Omit<ExaminationCourseRecord, 'id'>,
  ): Promise<ExaminationCourseRecord> => prisma.examinationCourse.create({ data }),
};