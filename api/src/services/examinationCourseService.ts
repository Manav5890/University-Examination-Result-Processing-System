import { ConflictError, NotFoundError } from '../errors/AppError';
import { courseRepository } from '../repositories/courseRepository';
import { examinationRepository } from '../repositories/examinationRepository';
import { examinationCourseRepository } from '../repositories/examinationCourseRepository';

export const examinationCourseService = {
  async addCourse(examinationId: string, courseId: string) {
    const examination = await examinationRepository.findById(examinationId);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const existing = await examinationCourseRepository.findByExaminationAndCourse(examinationId, courseId);
    if (existing) {
      throw new ConflictError('Course is already mapped to this examination');
    }

    return examinationCourseRepository.create({ examinationId, courseId });
  },

  async listCourses(examinationId: string) {
    const examination = await examinationRepository.findById(examinationId);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    return examinationCourseRepository.findManyByExaminationId(examinationId);
  },
};