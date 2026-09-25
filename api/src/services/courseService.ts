import { courseRepository } from '../repositories/courseRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export type CourseInput = {
  code: string;
  name: string;
  maxMarks: number;
  programmeId: string;
};

export const courseService = {
  async createCourse(input: CourseInput) {
    if (!input.code || !input.name || !input.programmeId || input.maxMarks <= 0) {
      throw new BadRequestError('Course code, name, programmeId, and valid maxMarks are required');
    }

    const existing = await courseRepository.findByCode(input.code);
    if (existing) {
      throw new BadRequestError('Course code already exists');
    }

    return courseRepository.create(input);
  },

  async listCourses() {
    return courseRepository.findMany();
  },

  async getCourseById(id: string) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return course;
  },
};
