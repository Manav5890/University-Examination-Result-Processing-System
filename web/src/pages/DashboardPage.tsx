import { useState } from 'react';
import { api, type Component, type Examination, type Result, type Student, type Course } from '../api/client';
import { AppShell } from '../components/AppShell';

type Workspace = { exam: Examination; student: Student; course: Course; components: Component[] };

export function DashboardPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState('Create a workspace to begin.');
  const [busy, setBusy] = useState(false);

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
      setWorkspace({ exam, student, course, components: [internal, final] });
      setMarks({});
      setResults([]);
      setMessage('Workspace ready. Enter every component mark.');
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
      for (const component of workspace.components) {
        await api.createMark({ examId: workspace.exam.id, studentId: workspace.student.id, courseId: workspace.course.id, componentId: component.id, value: Number(marks[component.id]) });
      }
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
    </div>
  </section></AppShell>;
}
