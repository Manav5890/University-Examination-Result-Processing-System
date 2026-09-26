import { prisma } from '../config/database';

export type EnrollmentRecord = {
  id: string;
  examId: string;
  studentId: string;
  courseId: string;
  createdAt: Date;
};

export const enrollmentRepository = {
  findManyByExamId: async (examId: string): Promise<EnrollmentRecord[]> =>
    prisma.examEnrollment.findMany({ where: { examId } }),

  findByExamStudentCourse: async (
    examId: string,
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentRecord | undefined> => (await prisma.examEnrollment.findUnique({ where: { examId_studentId_courseId: { examId, studentId, courseId } } })) ?? undefined,

  create: async (data: Omit<EnrollmentRecord, 'id' | 'createdAt'>): Promise<EnrollmentRecord> => prisma.examEnrollment.create({ data }),
};