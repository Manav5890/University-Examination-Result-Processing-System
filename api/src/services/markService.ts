import { markRepository } from '../repositories/markRepository';
import { assessmentComponentRepository } from '../repositories/assessmentComponentRepository';
import { courseRepository } from '../repositories/courseRepository';
import { enrollmentRepository } from '../repositories/enrollmentRepository';
import { examinationCourseRepository } from '../repositories/examinationCourseRepository';
import { examinationRepository } from '../repositories/examinationRepository';
import { studentRepository } from '../repositories/studentRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/AppError';

export type MarkInput = {
  examId: string;
  studentId: string;
  courseId: string;
  componentId: string;
  value: number;
};

export const markService = {
  async createMark(input: MarkInput) {
    if (
      !input.examId ||
      !input.studentId ||
      !input.courseId ||
      !input.componentId ||
      !Number.isFinite(input.value) ||
      input.value < 0
    ) {
      throw new BadRequestError('Valid exam, student, course, component id, and numeric value are required');
    }

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

    const component = await assessmentComponentRepository.findManyByCourseId(input.courseId);
    const selectedComponent = component.find((item) => item.id === input.componentId);
    if (!selectedComponent) {
      throw new NotFoundError('Assessment component not found for this course');
    }

    const mappedCourse = await examinationCourseRepository.findByExaminationAndCourse(input.examId, input.courseId);
    if (!mappedCourse) {
      throw new NotFoundError('Course is not mapped to this examination');
    }

    const enrollment = await enrollmentRepository.findByExamStudentCourse(
      input.examId,
      input.studentId,
      input.courseId,
    );
    if (!enrollment) {
      throw new NotFoundError('Student is not enrolled in this course for the examination');
    }

    if (input.value > selectedComponent.maxMarks) {
      throw new BadRequestError(`Mark cannot exceed the component maximum of ${selectedComponent.maxMarks}`);
    }

    const existing = await markRepository.findByExamStudentCourseComponent(
      input.examId,
      input.studentId,
      input.courseId,
      input.componentId,
    );
    if (existing) {
      throw new ConflictError('Mark already exists for this student, course, and component');
    }

    return markRepository.create(input);
  },

  async updateMark(id: string, value: number) {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestError('Marks must be a non-negative number');
    }

    const existing = await markRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Mark not found');
    }

    const components = await assessmentComponentRepository.findManyByCourseId(existing.courseId);
    const component = components.find((item) => item.id === existing.componentId);
    if (!component) {
      throw new NotFoundError('Assessment component not found for this mark');
    }

    if (value > component.maxMarks) {
      throw new BadRequestError(`Mark cannot exceed the component maximum of ${component.maxMarks}`);
    }

    return markRepository.updateById(id, value);
  },

  async listMarks() {
    return markRepository.findMany();
  },
};
