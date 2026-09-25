import { BadRequestError, ConflictError, NotFoundError } from '../errors/AppError';
import { courseRepository } from '../repositories/courseRepository';
import { assessmentComponentRepository } from '../repositories/assessmentComponentRepository';

export type AssessmentComponentInput = {
  courseId: string;
  name: string;
  maxMarks: number;
  weightage: number;
};

export const assessmentComponentService = {
  async createComponent(input: AssessmentComponentInput) {
    if (!input.courseId || !input.name || input.maxMarks <= 0 || input.weightage <= 0) {
      throw new BadRequestError('courseId, name, positive maxMarks, and positive weightage are required');
    }

    const course = await courseRepository.findById(input.courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const existing = await assessmentComponentRepository.findByCourseAndName(input.courseId, input.name);
    if (existing) {
      throw new ConflictError('Assessment component already exists for this course');
    }

    return assessmentComponentRepository.create(input);
  },

  async listComponents(courseId: string) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return assessmentComponentRepository.findManyByCourseId(courseId);
  },
};