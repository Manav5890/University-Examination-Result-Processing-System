import { useEffect, useState } from 'react';
import { api, type Component, type Course, type Examination, type ImportJob, type Mark, type Programme, type Result, type Student } from '../api/client';
import { AppShell } from '../components/AppShell';

type Workspace = {
  programme: Programme;
  exam: Examination;
  student: Student;
  course: Course;
  components: Component[];
  marks: Mark[];
};

type SavedWorkspace = { programmeId: string; examId: string; studentId: string; courseId: string };
const workspaceStorageKey = 'exam-control-room-workspace';
const importStorageKey = 'exam-control-room-import-job';

export function DashboardPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Result[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [message, setMessage] = useState('Loading your workspace...');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrateWorkspace();
    const savedJobId = localStorage.getItem(importStorageKey);
    if (savedJobId) void pollImport(savedJobId);
  }, []);

  async function hydrateWorkspace() {
    const rawWorkspace = localStorage.getItem(workspaceStorageKey);
    if (!rawWorkspace) {
      setMessage('Create a workspace to begin.');
      return;
    }

    try {
      const saved = JSON.parse(rawWorkspace) as SavedWorkspace;
      const [programmes, examinations, students, courses] = await Promise.all([
        api.getProgrammes(),
        api.getExaminations(),
        api.getStudents(),
        api.getCourses(),
      ]);
      const programme = programmes.find((item) => item.id === saved.programmeId);
      const exam = examinations.find((item) => item.id === saved.examId);
      const student = students.find((item) => item.id === saved.studentId);
      const course = courses.find((item) => item.id === saved.courseId);
      if (!programme || !exam || !student || !course) throw new Error('Saved workspace is no longer available on the API');

      const [components, examCourses, enrollments, allMarks, storedResults] = await Promise.all([
        api.getComponents(course.id),
        api.getExamCourses(exam.id),
        api.getEnrollments(exam.id),
        api.getMarks(),
        api.getResults(exam.id),
      ]);
      if (!examCourses.some((item) => item.courseId === course.id)) throw new Error('Saved course is no longer mapped to the examination');
      if (!enrollments.some((item) => item.studentId === student.id && item.courseId === course.id)) throw new Error('Saved student is no longer enrolled');

      const workspaceMarks = allMarks.filter((mark) => mark.examId === exam.id && mark.studentId === student.id && mark.courseId === course.id);
      setWorkspace({ programme, exam, student, course, components, marks: workspaceMarks });
      setMarks(Object.fromEntries(workspaceMarks.map((mark) => [mark.componentId, String(mark.value)])));
      setResults(storedResults);
      setMessage('Workspace restored from the API.');
    } catch (error) {
      localStorage.removeItem(workspaceStorageKey);
      setMessage(error instanceof Error ? error.message : 'Could not restore workspace');
    }
  }

  function rememberWorkspace(nextWorkspace: Workspace) {
    localStorage.setItem(workspaceStorageKey, JSON.stringify({
      programmeId: nextWorkspace.programme.id,
      examId: nextWorkspace.exam.id,
      studentId: nextWorkspace.student.id,
      courseId: nextWorkspace.course.id,
    } satisfies SavedWorkspace));
    setWorkspace(nextWorkspace);
    setMarks(Object.fromEntries(nextWorkspace.marks.map((mark) => [mark.componentId, String(mark.value)])));
  }

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const programme = await api.createProgramme({ name: form.get('programmeName'), code: `${form.get('programmeCode')}-${Date.now()}` });
      const course = await api.createCourse({ code: `${form.get('courseCode')}-${Date.now()}`, name: form.get('courseName'), maxMarks: 100, programmeId: programme.id });
      const exam = await api.createExam({ name: form.get('examName'), semester: '1', academicYear: '2026', startDate: '2026-10-01', endDate: '2026-10-15' });
      const student = await api.createStudent({ rollNumber: `${form.get('rollNumber')}-${Date.now()}`, name: form.get('studentName'), email: `${Date.now()}@example.com`, programmeId: programme.id });
      await api.mapCourse(exam.id, course.id);
      const internal = await api.createComponent(course.id, { name: 'Internal', maxMarks: 30, weightage: 30 });
      const final = await api.createComponent(course.id, { name: 'Final', maxMarks: 70, weightage: 70 });
      await api.enroll(exam.id, { studentId: student.id, courseId: course.id });
      rememberWorkspace({ programme, exam, student, course, components: [internal, final], marks: [] });
      setResults([]);
      setImportJob(null);
      setMessage('Workspace created. Enter every component mark.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create workspace');
    } finally {
      setBusy(false);
    }
  }

  async function saveMarks() {
    if (!workspace) return;
    setBusy(true);
    try {
      const savedMarks: Mark[] = [];
      for (const component of workspace.components) {
        const value = Number(marks[component.id]);
        if (!Number.isFinite(value)) throw new Error(`Enter a mark for ${component.name}`);
        const existing = workspace.marks.find((mark) => mark.componentId === component.id);
        const savedMark = existing ? await api.updateMark(existing.id, value) : await api.createMark({ examId: workspace.exam.id, studentId: workspace.student.id, courseId: workspace.course.id, componentId: component.id, value });
        savedMarks.push(savedMark);
      }
      setWorkspace({ ...workspace, marks: savedMarks });
      setResults([]);
      setMessage('Marks saved and validated. You can calculate the result now.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save marks');
    } finally {
      setBusy(false);
    }
  }

  async function calculate() {
    if (!workspace) return;
    setBusy(true);
    try { setResults(await api.calculate(workspace.exam.id)); setMessage('Result calculated. Review it before publishing.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not calculate'); } finally { setBusy(false); }
  }

  async function publish() {
    if (!workspace) return;
    setBusy(true);
    try { setResults(await api.publish(workspace.exam.id)); setMessage('Result published successfully.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not publish'); } finally { setBusy(false); }
  }

  async function queueImport() {
    if (!selectedFile) { setMessage('Choose a CSV file before queueing an import.'); return; }
    setBusy(true);
    try {
      const queued = await api.queueImport(selectedFile);
      localStorage.setItem(importStorageKey, queued.jobId);
      setMessage(`Import ${queued.jobId} queued.`);
      await pollImport(queued.jobId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not queue import');
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob(['examId,studentId,courseId,componentId,value\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marks-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function pollImport(jobId: string) {
    try {
      const job = await api.getImportStatus(jobId);
      setImportJob(job);
      if (job.status === 'QUEUED' || job.status === 'PROCESSING') window.setTimeout(() => void pollImport(jobId), 1000);
      else localStorage.removeItem(importStorageKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read import status');
    }
  }

  return <AppShell><section className="dashboard" id="workspace">
    <div className="status-banner"><span className="status-dot"></span>{message}</div>
    <div className="dashboard-grid">
      <section className="dashboard-card setup-card"><div className="card-title"><div><span className="section-number">01</span><h2>Set up a sitting</h2></div><span className="tag">Exam setup</span></div>
        <form className="workspace-form" onSubmit={createWorkspace}>
          <label>Programme<input name="programmeName" defaultValue="Computer Science" required /></label><label>Programme code<input name="programmeCode" defaultValue="CSE" required /></label>
          <label>Course<input name="courseName" defaultValue="Algorithms" required /></label><label>Course code<input name="courseCode" defaultValue="CS101" required /></label>
          <label>Exam name<input name="examName" defaultValue="Semester Examination" required /></label><label>Student roll number<input name="rollNumber" defaultValue="CSE-001" required /></label>
          <label className="wide-field">Student name<input name="studentName" defaultValue="Aarav Sharma" required /></label>
          <button className="primary-button wide-field" disabled={busy} type="submit">{busy ? 'Creating...' : 'Create workspace'} <span>→</span></button>
        </form>
      </section>
      <section className="dashboard-card marks-card" id="marks"><div className="card-title"><div><span className="section-number">02</span><h2>Marks register</h2></div><span className="tag">Validated</span></div>
        {!workspace ? <div className="empty-state">Workspace marks will appear here after setup.</div> : <><p className="context-line">{workspace.student.name} / {workspace.course.code}</p>{workspace.components.map((component) => <label className="mark-line" key={component.id}><span>{component.name}<small>Maximum {component.maxMarks}</small></span><input type="number" min="0" max={component.maxMarks} value={marks[component.id] ?? ''} onChange={(event) => setMarks({ ...marks, [component.id]: event.target.value })} /></label>)}<button className="secondary-button" disabled={busy} onClick={saveMarks}>Save marks</button></>}
      </section>
      <section className="dashboard-card result-card" id="results"><div className="card-title"><div><span className="section-number">03</span><h2>Results</h2></div><span className="tag">Publish gate</span></div>
        <div className="result-buttons"><button className="primary-button" disabled={!workspace || busy} onClick={calculate}>Calculate</button><button className="secondary-button" disabled={!results.length || busy} onClick={publish}>Publish</button></div>
        {!results.length ? <div className="empty-state">Calculation output will appear here for review.</div> : <div className="result-table"><div className="result-head"><span>Total</span><span>Percent</span><span>Grade</span><span>Status</span></div>{results.map((result, index) => <div className="result-row" key={index}><strong>{result.totalMarks}/{result.maximumMarks}</strong><span>{result.percentage}%</span><b>{result.grade}</b><span>{result.status}</span></div>)}</div>}
      </section>
      <section className="dashboard-card import-card" id="imports"><div className="card-title"><div><span className="section-number">04</span><h2>Bulk imports</h2></div><span className="tag">PostgreSQL queue</span></div>
        <p className="context-line">Upload a CSV exported from Excel or Google Sheets. Columns: examId, studentId, courseId, componentId, value</p>
        <div className="file-drop"><input type="file" accept=".csv,text/csv" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /><span>{selectedFile?.name ?? 'Choose a CSV file'}</span></div>
        <div className="import-actions"><button className="ghost-button" onClick={downloadTemplate}>Download template</button><button className="secondary-button" disabled={busy || !selectedFile} onClick={queueImport}>Upload and queue</button></div>
        {importJob && <div className="import-progress">{importJob.status}: {importJob.processed}/{importJob.total || '?'} processed, {importJob.successful} successful, {importJob.failed} failed</div>}
      </section>
    </div>
  </section></AppShell>;
}
