export type EnrollmentRecord = {
  id: string;
  examId: string;
  studentId: string;
  courseId: string;
  createdAt: Date;
};

const enrollments: EnrollmentRecord[] = [];

export const enrollmentRepository = {
  findManyByExamId: async (examId: string): Promise<EnrollmentRecord[]> =>
    enrollments.filter((enrollment) => enrollment.examId === examId),

  findByExamStudentCourse: async (
    examId: string,
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentRecord | undefined> =>
    enrollments.find(
      (enrollment) =>
        enrollment.examId === examId &&
        enrollment.studentId === studentId &&
        enrollment.courseId === courseId,
    ),

  create: async (data: Omit<EnrollmentRecord, 'id' | 'createdAt'>): Promise<EnrollmentRecord> => {
    const item: EnrollmentRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };

    enrollments.push(item);
    return item;
  },
};