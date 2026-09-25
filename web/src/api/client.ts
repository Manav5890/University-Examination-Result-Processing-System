const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isMultipart = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    headers: isMultipart ? options.headers : { 'content-type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? 'Request failed');
  return body.data as T;
}

export const api = {
  getProgrammes: () => request<Programme[]>('/programmes'),
  getCourses: () => request<Course[]>('/courses'),
  getExaminations: () => request<Examination[]>('/examinations'),
  getStudents: () => request<Student[]>('/students'),
  getComponents: (courseId: string) => request<Component[]>(`/courses/${courseId}/components`),
  getExamCourses: (examId: string) => request<ExamCourse[]>(`/examinations/${examId}/courses`),
  getEnrollments: (examId: string) => request<Enrollment[]>(`/examinations/${examId}/enrollments`),
  getMarks: () => request<Mark[]>('/marks'),
  getResults: (examId: string) => request<Result[]>(`/examinations/${examId}/results`),
  createProgramme: (body: object) => request<Programme>('/programmes', { method: 'POST', body: JSON.stringify(body) }),
  createCourse: (body: object) => request<Course>('/courses', { method: 'POST', body: JSON.stringify(body) }),
  createExam: (body: object) => request<Examination>('/examinations', { method: 'POST', body: JSON.stringify(body) }),
  createStudent: (body: object) => request<Student>('/students', { method: 'POST', body: JSON.stringify(body) }),
  mapCourse: (examId: string, courseId: string) => request<ExamCourse>(`/examinations/${examId}/courses`, { method: 'POST', body: JSON.stringify({ courseId }) }),
  createComponent: (courseId: string, body: object) => request<Component>(`/courses/${courseId}/components`, { method: 'POST', body: JSON.stringify(body) }),
  enroll: (examId: string, body: object) => request<Enrollment>(`/examinations/${examId}/enrollments`, { method: 'POST', body: JSON.stringify(body) }),
  createMark: (body: object) => request<Mark>('/marks', { method: 'POST', body: JSON.stringify(body) }),
  updateMark: (markId: string, value: number) => request<Mark>(`/marks/${markId}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  queueImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ jobId: string; status: string }>('/marks/import', { method: 'POST', body: formData });
  },
  getImportStatus: (jobId: string) => request<ImportJob>(`/marks/import/${jobId}`),
  calculate: (examId: string) => request<Result[]>(`/examinations/${examId}/results/calculate`, { method: 'POST' }),
  publish: (examId: string) => request<Result[]>(`/examinations/${examId}/results/publish`, { method: 'POST' }),
};

export type Programme = { id: string; name: string; code: string };
export type Course = { id: string; name: string; code: string; maxMarks: number };
export type Examination = { id: string; name: string; status: string };
export type Student = { id: string; name: string; rollNumber: string };
export type ExamCourse = { id: string; examinationId: string; courseId: string };
export type Component = { id: string; name: string; maxMarks: number; weightage: number };
export type Enrollment = { id: string; examId: string; studentId: string; courseId: string };
export type Mark = { id: string; examId: string; studentId: string; courseId: string; componentId: string; value: number };
export type Result = { totalMarks: number; maximumMarks: number; percentage: number; grade: string; status: string; publishedAt?: string };
export type ImportJob = { id: string; fileName: string; status: string; total: number; processed: number; successful: number; failed: number; errorMessage?: string };
