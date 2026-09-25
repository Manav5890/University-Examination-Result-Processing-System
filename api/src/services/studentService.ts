import { studentRepository } from '../repositories/studentRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export type StudentInput = {
  rollNumber: string;
  name: string;
  email: string;
  programmeId: string;
};

export const studentService = {
  async createStudent(input: StudentInput) {
    if (!input.rollNumber || !input.name || !input.email || !input.programmeId) {
      throw new BadRequestError('All student fields are required');
    }

    const existingRoll = await studentRepository.findByRollNumber(input.rollNumber);
    if (existingRoll) {
      throw new BadRequestError('Student roll number already exists');
    }

    return studentRepository.create(input);
  },

  async listStudents() {
    return studentRepository.findMany();
  },

  async getStudentById(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    return student;
  },
};
