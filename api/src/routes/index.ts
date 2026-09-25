import { Router } from 'express';
import { programmeRoutes } from './programmesRoutes';
import { studentRoutes } from './studentsRoutes';
import { courseRoutes } from './coursesRoutes';
import { examinationRoutes } from './examinationsRoutes';
import { markRoutes } from './marksRoutes';
import { assessmentComponentRoutes } from './assessmentComponentsRoutes';
import { examinationCourseRoutes } from './examinationCoursesRoutes';
import { enrollmentRoutes } from './enrollmentsRoutes';
import { resultRoutes } from './resultsRoutes';

export const apiRoutes = Router();

apiRoutes.use('/programmes', programmeRoutes);
apiRoutes.use('/students', studentRoutes);
apiRoutes.use('/courses', courseRoutes);
apiRoutes.use('/examinations', examinationRoutes);
apiRoutes.use('/marks', markRoutes);
apiRoutes.use(assessmentComponentRoutes);
apiRoutes.use(examinationCourseRoutes);
apiRoutes.use(enrollmentRoutes);
apiRoutes.use(resultRoutes);
