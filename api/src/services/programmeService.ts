import { programmeRepository } from '../repositories/programmeRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export type ProgrammeInput = {
  name: string;
  code: string;
  description?: string;
};

export const programmeService = {
  async createProgramme(input: ProgrammeInput) {
    if (!input.name || !input.code) {
      throw new BadRequestError('Programme name and code are required');
    }

    const existing = (await programmeRepository.findMany()).find((item) => item.code === input.code);
    if (existing) {
      throw new BadRequestError('Programme code already exists');
    }

    return programmeRepository.create(input);
  },

  async listProgrammes() {
    return programmeRepository.findMany();
  },

  async getProgrammeById(id: string) {
    const programme = await programmeRepository.findById(id);
    if (!programme) {
      throw new NotFoundError('Programme not found');
    }

    return programme;
  },
};
