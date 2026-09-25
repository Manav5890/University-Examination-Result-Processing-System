import { ConflictError, NotFoundError } from '../errors/AppError';
import { courseRepository } from '../repositories/courseRepository';
import { examinationRepository } from '../repositories/examinationRepository';
import { studentRepository } from '../repositories/studentRepository';
import { examinationCourseRepository } from '../repositories/examinationCourseRepository';
import { enrollmentRepository } from '../repositories/enrollmentRepository';

export type EnrollmentInput = {
  examId: string;
  studentId: string;
  courseId: string;
};

export const enrollmentService = {
  async enrollStudent(input: EnrollmentInput) {
    const examination = await examinationRepository.findById(input.examId);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    const student = await studentRepository.findById(input.studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const course = await courseRepository.findById(input.courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const mappedCourse = await examinationCourseRepository.findByExaminationAndCourse(input.examId, input.courseId);
    if (!mappedCourse) {
      throw new NotFoundError('Course is not mapped to this examination');
    }

    const existing = await enrollmentRepository.findByExamStudentCourse(
      input.examId,
      input.studentId,
      input.courseId,
    );
    if (existing) {
      throw new ConflictError('Student is already enrolled in this course for the examination');
    }

    return enrollmentRepository.create(input);
  },

  async listEnrollments(examId: string) {
    const examination = await examinationRepository.findById(examId);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    return enrollmentRepository.findManyByExamId(examId);
  },
};