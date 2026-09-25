import { BadRequestError, NotFoundError } from '../errors/AppError';
import { assessmentComponentRepository } from '../repositories/assessmentComponentRepository';
import { enrollmentRepository } from '../repositories/enrollmentRepository';
import { examinationRepository } from '../repositories/examinationRepository';
import { markRepository } from '../repositories/markRepository';
import { resultRepository } from '../repositories/resultRepository';

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  if (percentage >= 50) return 'E';
  return 'F';
}

export const resultService = {
  async calculateResults(examId: string) {
    const examination = await examinationRepository.findById(examId);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    const enrollments = await enrollmentRepository.findManyByExamId(examId);
    if (enrollments.length === 0) {
      throw new BadRequestError('Cannot calculate results without enrollments');
    }

    const totals = new Map<string, { totalMarks: number; maximumMarks: number }>();

    for (const enrollment of enrollments) {
      const components = await assessmentComponentRepository.findManyByCourseId(enrollment.courseId);
      if (components.length === 0) {
        throw new BadRequestError(`Course ${enrollment.courseId} has no assessment components`);
      }

      const marks = await markRepository.findManyByExamStudent(enrollment.examId, enrollment.studentId);
      const courseMarks = marks.filter((mark) => mark.courseId === enrollment.courseId);

      for (const component of components) {
        const mark = courseMarks.find((item) => item.componentId === component.id);
        if (!mark) {
          throw new BadRequestError(
            `Missing mark for student ${enrollment.studentId}, course ${enrollment.courseId}, component ${component.id}`,
          );
        }
      }

      const current = totals.get(enrollment.studentId) ?? { totalMarks: 0, maximumMarks: 0 };
      current.totalMarks += components.reduce(
        (total, component) => total + (courseMarks.find((mark) => mark.componentId === component.id)?.value ?? 0),
        0,
      );
      current.maximumMarks += components.reduce((total, component) => total + component.maxMarks, 0);
      totals.set(enrollment.studentId, current);
    }

    const results = [];
    for (const [studentId, total] of totals) {
      const percentage = Number(((total.totalMarks / total.maximumMarks) * 100).toFixed(2));
      results.push(
        await resultRepository.upsert({
          examId,
          studentId,
          totalMarks: total.totalMarks,
          maximumMarks: total.maximumMarks,
          percentage,
          grade: getGrade(percentage),
          status: percentage >= 50 ? 'PASS' : 'FAIL',
        }),
      );
    }

    await examinationRepository.updateStatus(examId, 'CALCULATED');
    return results;
  },

  async publishResults(examId: string) {
    const examination = await examinationRepository.findById(examId);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    if (examination.status !== 'CALCULATED' && examination.status !== 'PUBLISHED') {
      throw new BadRequestError('Results must be calculated before publishing');
    }

    const results = await resultRepository.findManyByExamId(examId);
    if (results.length === 0) {
      throw new BadRequestError('No calculated results found for this examination');
    }

    const publishedResults = await resultRepository.publishByExamId(examId);
    await examinationRepository.updateStatus(examId, 'PUBLISHED');
    return publishedResults;
  },

  async listResults(examId: string) {
    const examination = await examinationRepository.findById(examId);
    if (!examination) {
      throw new NotFoundError('Examination not found');
    }

    return resultRepository.findManyByExamId(examId);
  },
};