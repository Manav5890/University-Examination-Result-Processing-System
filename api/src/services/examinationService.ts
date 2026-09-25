import { examinationRepository } from '../repositories/examinationRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export type ExaminationInput = {
  name: string;
  semester: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PROCESSING' | 'CALCULATED' | 'PUBLISHED';
};

export const examinationService = {
  async createExamination(input: ExaminationInput) {
    if (!input.name || !input.semester || !input.academicYear || !input.startDate || !input.endDate) {
      throw new BadRequestError('Examination name, semester, academicYear, startDate and endDate are required');
    }

    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new BadRequestError('Invalid examination date range');
    }

    return examinationRepository.create({
      ...input,
      status: input.status ?? 'DRAFT',
      startDate: start,
      endDate: end,
    });
  },

  async listExaminations() {
    return examinationRepository.findMany();
  },

  async getExaminationById(id: string) {
    const examination = await examinationRepository.findById(id);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    return examination;
  },
};
