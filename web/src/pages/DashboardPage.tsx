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
  const [activeTab, setActiveTab] = useState<'workspace' | 'testing-guide'>('workspace');

  useEffect(() => {
    void hydrateWorkspace();
    const savedJobId = localStorage.getItem(importStorageKey);
    if (savedJobId) void pollImport(savedJobId);
  }, []);

  async function hydrateWorkspace() {
    const rawWorkspace = localStorage.getItem(workspaceStorageKey);
    if (!rawWorkspace) {
      setMessage('Create a workspace or run test seed to begin testing.');
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
      setMessage('Workspace restored from PostgreSQL database.');
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
      const internal = await api.createComponent(course.id, { name: 'Internal Exam', maxMarks: 30, weightage: 30 });
      const final = await api.createComponent(course.id, { name: 'Final Exam', maxMarks: 70, weightage: 70 });
      await api.enroll(exam.id, { studentId: student.id, courseId: course.id });
      rememberWorkspace({ programme, exam, student, course, components: [internal, final], marks: [] });
      setResults([]);
      setImportJob(null);
      setMessage('Workspace created successfully! Enter marks or test CSV import.');
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
        if (!Number.isFinite(value)) throw new Error(`Enter a valid numeric mark for ${component.name}`);
        const existing = workspace.marks.find((mark) => mark.componentId === component.id);
        const savedMark = existing ? await api.updateMark(existing.id, value) : await api.createMark({ examId: workspace.exam.id, studentId: workspace.student.id, courseId: workspace.course.id, componentId: component.id, value });
        savedMarks.push(savedMark);
      }
      setWorkspace({ ...workspace, marks: savedMarks });
      setResults([]);
      setMessage('Marks validated & saved to database. Ready for result calculation.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save marks');
    } finally {
      setBusy(false);
    }
  }

  async function calculate() {
    if (!workspace) return;
    setBusy(true);
    try { 
      setResults(await api.calculate(workspace.exam.id)); 
      setMessage('Results calculated and grade assigned. Status updated to CALCULATED.'); 
    } catch (error) { 
      setMessage(error instanceof Error ? error.message : 'Could not calculate results'); 
    } finally { 
      setBusy(false); 
    }
  }

  async function publish() {
    if (!workspace) return;
    setBusy(true);
    try { 
      setResults(await api.publish(workspace.exam.id)); 
      setMessage('Results published successfully. Examination status updated to PUBLISHED.'); 
    } catch (error) { 
      setMessage(error instanceof Error ? error.message : 'Could not publish results'); 
    } finally { 
      setBusy(false); 
    }
  }

  async function queueImport() {
    if (!selectedFile) { setMessage('Please select a CSV file first.'); return; }
    setBusy(true);
    try {
      const queued = await api.queueImport(selectedFile);
      localStorage.setItem(importStorageKey, queued.jobId);
      setMessage(`Import Job #${queued.jobId} enqueued in pg-boss worker queue.`);
      await pollImport(queued.jobId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not queue import');
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const header = 'examId,studentId,courseId,componentId,value\n';
    const sample = workspace 
      ? `${workspace.exam.id},${workspace.student.id},${workspace.course.id},${workspace.components[0]?.id || 'COMP_ID'},25\n`
      : 'EXAM_UUID,STUDENT_UUID,COURSE_UUID,COMPONENT_UUID,85\n';
    const blob = new Blob([header + sample], { type: 'text/csv' });
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
      if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
        window.setTimeout(() => void pollImport(jobId), 1000);
      } else {
        localStorage.removeItem(importStorageKey);
        if (workspace) void hydrateWorkspace();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read import status');
    }
  }

  return (
    <AppShell>
      <section className="dashboard" id="workspace">
        {/* System & Assignment Context Banner */}
        <div style={{ background: '#172b32', color: '#f5f6ec', padding: '24px', borderRadius: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#249b8b', letterSpacing: '0.1em' }}>
                BACKEND ENGINEER ASSIGNMENT
              </span>
              <h2 style={{ fontSize: '24px', margin: '4px 0 8px 0', letterSpacing: '-0.03em', color: '#fff' }}>
                University Examination & Result Processing System
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#b9d5d0', maxWidth: '850px', lineHeight: '1.5' }}>
                Designed for high throughput: handles 1,000,000+ students, 100,000+ marks per examination, multi-component course evaluations, and result publishing. 
                Uses <strong>PostgreSQL + pg-boss queue</strong> for durable async CSV background processing without Redis dependencies.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={activeTab === 'workspace' ? 'primary-button' : 'ghost-button'} 
                onClick={() => setActiveTab('workspace')}
                style={{ cursor: 'pointer' }}
              >
                Operational Workspace
              </button>
              <button 
                className={activeTab === 'testing-guide' ? 'primary-button' : 'ghost-button'} 
                onClick={() => setActiveTab('testing-guide')}
                style={{ cursor: 'pointer' }}
              >
                Assignment Test Guide & CSVs
              </button>
            </div>
          </div>
        </div>

        {/* Live Notification Bar */}
        <div className="status-banner">
          <span className="status-dot"></span>
          <strong>System Status:</strong> {message}
        </div>

        {activeTab === 'testing-guide' ? (
          <section className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-title">
              <div>
                <span className="section-number">TESTING SUITE</span>
                <h2>How to Test Every Feature of the Assignment</h2>
              </div>
              <span className="tag">Step-by-Step Testing Guide</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', fontSize: '13px', lineHeight: '1.6' }}>
              
              <div style={{ background: '#f8faf9', padding: '16px', borderRadius: '8px', border: '1px solid #dbe5e1' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#168678', fontSize: '15px' }}>1. Generate Pre-Seeded Test CSVs</h3>
                <p>Run the following command in terminal inside `api/` directory:</p>
                <code style={{ display: 'block', background: '#172b32', color: '#9bd6c9', padding: '10px', borderRadius: '6px', fontSize: '12px', margin: '8px 0' }}>
                  cd api && npm run seed:test-csvs
                </code>
                <p>This seeds real DB records and generates 4 ready-to-test CSV files:</p>
                <ul>
                  <li><code>test-1-valid-marks.csv</code> (All valid rows)</li>
                  <li><code>test-2-overmarks-error.csv</code> (Mark &gt; maxMarks)</li>
                  <li><code>test-3-unenrolled-error.csv</code> (Unenrolled student)</li>
                  <li><code>test-4-mixed-validation.csv</code> (Partial success/failure)</li>
                </ul>
              </div>

              <div style={{ background: '#f8faf9', padding: '16px', borderRadius: '8px', border: '1px solid #dbe5e1' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#168678', fontSize: '15px' }}>2. Test 10,000 Bulk Upload (Scale Test)</h3>
                <p>Test background queue performance with 10,000 records:</p>
                <code style={{ display: 'block', background: '#172b32', color: '#9bd6c9', padding: '10px', borderRadius: '6px', fontSize: '12px', margin: '8px 0' }}>
                  cd api && npm run seed:10k
                </code>
                <p>Upload the generated <code>marks-10000-valid-*.csv</code> file in section 04 below to observe streaming & progress polling.</p>
              </div>

              <div style={{ background: '#f8faf9', padding: '16px', borderRadius: '8px', border: '1px solid #dbe5e1' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#168678', fontSize: '15px' }}>3. Test Validation & Idempotency Rules</h3>
                <ul>
                  <li><strong>Max Marks Check:</strong> Upload a CSV row with mark value 150/100 → Worker logs row as failed.</li>
                  <li><strong>Enrollment Verification:</strong> Upload mark for student not enrolled → Worker logs failure.</li>
                  <li><strong>Idempotency Constraint:</strong> Re-uploading the same mark updates or rejects duplicate key without corrupting DB.</li>
                </ul>
              </div>

              <div style={{ background: '#f8faf9', padding: '16px', borderRadius: '8px', border: '1px solid #dbe5e1' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#168678', fontSize: '15px' }}>4. Test Calculation & Publishing Gate</h3>
                <ol style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Create a workspace sitting (Section 01).</li>
                  <li>Save component marks (Section 02).</li>
                  <li>Click <strong>Calculate</strong> to trigger percentage, letter grade assignment (A-F), and state update.</li>
                  <li>Click <strong>Publish</strong> to lock results for students.</li>
                </ol>
              </div>

            </div>
          </section>
        ) : (
          <>
            {workspace && (
              <section className="workspace-overview">
                <div>
                  <span>PROGRAMME</span>
                  <strong>{workspace.programme.code}</strong>
                  <small>{workspace.programme.name}</small>
                </div>
                <div>
                  <span>EXAMINATION</span>
                  <strong>{workspace.exam.name}</strong>
                  <small>STATUS: {workspace.exam.status}</small>
                </div>
                <div>
                  <span>COURSE</span>
                  <strong>{workspace.course.code}</strong>
                  <small>{workspace.course.name}</small>
                </div>
                <div>
                  <span>STUDENT</span>
                  <strong>{workspace.student.rollNumber}</strong>
                  <small>{workspace.student.name}</small>
                </div>
              </section>
            )}

            <div className="dashboard-grid">
              {/* Section 01: Setup */}
              <section className="dashboard-card setup-card">
                <div className="card-title">
                  <div>
                    <span className="section-number">01</span>
                    <h2>Examination Sitting Setup</h2>
                  </div>
                  <span className="tag">Academic Hierarchy</span>
                </div>
                <form className="workspace-form" onSubmit={createWorkspace}>
                  <label>Programme Name<input name="programmeName" defaultValue="Computer Science & Eng" required /></label>
                  <label>Programme Code<input name="programmeCode" defaultValue="CSE" required /></label>
                  <label>Course Name<input name="courseName" defaultValue="Data Structures & Algorithms" required /></label>
                  <label>Course Code<input name="courseCode" defaultValue="CS201" required /></label>
                  <label>Exam Name<input name="examName" defaultValue="Fall 2026 Examination" required /></label>
                  <label>Student Roll No.<input name="rollNumber" defaultValue="CSE-2026-001" required /></label>
                  <label className="wide-field">Student Name<input name="studentName" defaultValue="Aarav Sharma" required /></label>
                  <button className="primary-button wide-field" disabled={busy} type="submit">
                    {busy ? 'Creating...' : workspace ? 'Create New Workspace' : 'Initialize Workspace'} <span>→</span>
                  </button>
                </form>
              </section>

              {/* Section 02: Marks Register */}
              <section className="dashboard-card marks-card" id="marks">
                <div className="card-title">
                  <div>
                    <span className="section-number">02</span>
                    <h2>Component Marks Entry</h2>
                  </div>
                  <span className="tag">Domain Validation</span>
                </div>
                {!workspace ? (
                  <div className="empty-state">
                    Initialize a workspace sitting in Section 01 to manually enter component marks.
                  </div>
                ) : (
                  <>
                    <p className="context-line">
                      Student: <strong>{workspace.student.name}</strong> | Course: <strong>{workspace.course.code}</strong>
                    </p>
                    {workspace.components.map((component) => (
                      <label className="mark-line" key={component.id}>
                        <span>
                          {component.name}
                          <small>Max Allowed: {component.maxMarks} marks (Weight: {component.weightage}%)</small>
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={component.maxMarks}
                          value={marks[component.id] ?? ''}
                          onChange={(event) => setMarks({ ...marks, [component.id]: event.target.value })}
                        />
                      </label>
                    ))}
                    <button className="secondary-button" disabled={busy} onClick={saveMarks}>
                      Validate & Save Marks
                    </button>
                  </>
                )}
              </section>

              {/* Section 03: Results Engine */}
              <section className="dashboard-card result-card" id="results">
                <div className="card-title">
                  <div>
                    <span className="section-number">03</span>
                    <h2>Result Processing & Publishing</h2>
                  </div>
                  <span className="tag">Publish Gate</span>
                </div>
                <div className="result-buttons">
                  <button className="primary-button" disabled={!workspace || busy} onClick={calculate}>
                    Calculate Results
                  </button>
                  <button className="secondary-button" disabled={!results.length || busy} onClick={publish}>
                    Publish Results
                  </button>
                </div>
                {!results.length ? (
                  <div className="empty-state">
                    Calculated percentages, letter grades (A, B, C, D, E, F), and PASS/FAIL status will appear here.
                  </div>
                ) : (
                  <div className="result-table">
                    <div className="result-head">
                      <span>Total Marks</span>
                      <span>Percentage</span>
                      <span>Grade</span>
                      <span>Status</span>
                    </div>
                    {results.map((result, index) => (
                      <div className="result-row" key={index}>
                        <strong>{result.totalMarks} / {result.maximumMarks}</strong>
                        <span>{result.percentage}%</span>
                        <b style={{ color: result.grade === 'F' ? '#c34d3e' : '#168678' }}>{result.grade}</b>
                        <span>{result.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Section 04: Bulk CSV Queue Ingestion */}
              <section className="dashboard-card import-card" id="imports" style={{ gridColumn: '1 / -1' }}>
                <div className="card-title">
                  <div>
                    <span className="section-number">04</span>
                    <h2>Asynchronous Bulk CSV Import Engine (Scale Design)</h2>
                  </div>
                  <span className="tag">pg-boss Worker Queue</span>
                </div>
                <p className="context-line" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                  <strong>Why Bulk Ingestion Engine was built:</strong> Processing 100,000+ mark rows synchronously over standard HTTP requests causes API connection timeouts and blocks the web thread. 
                  This system uploads the CSV to storage, enqueues a background job in PostgreSQL (`pg-boss`), streams lines via `csv-parse`, applies domain validations, and logs real-time batch progress (`total`, `processed`, `successful`, `failed`).
                </p>
                <div className="file-drop" style={{ marginBottom: '16px' }}>
                  <input type="file" accept=".csv,text/csv" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                  <span>{selectedFile ? `Selected: ${selectedFile.name}` : 'Choose or drop a CSV file here...'}</span>
                </div>
                <div className="import-actions" style={{ display: 'flex', gap: '12px' }}>
                  <button className="ghost-button" onClick={downloadTemplate}>
                    Download CSV Header Template
                  </button>
                  <button className="secondary-button" disabled={busy || !selectedFile} onClick={queueImport}>
                    Upload & Enqueue Worker Import
                  </button>
                </div>

                {importJob && (
                  <div style={{ marginTop: '20px', background: '#f2f7f4', padding: '16px', borderRadius: '8px', border: '1px solid #c9e2d7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong>Import Job Status: <span style={{ color: '#168678' }}>{importJob.status}</span></strong>
                      <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>Job ID: {importJob.id}</span>
                    </div>
                    <div style={{ background: '#d6e5df', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div 
                        style={{ 
                          background: '#168678', 
                          height: '100%', 
                          width: `${importJob.total ? Math.round((importJob.processed / importJob.total) * 100) : 0}%`,
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                      <span><strong>Total Rows:</strong> {importJob.total}</span>
                      <span><strong>Processed:</strong> {importJob.processed}</span>
                      <span style={{ color: '#168678' }}><strong>Successful:</strong> {importJob.successful}</span>
                      <span style={{ color: importJob.failed > 0 ? '#c34d3e' : '#687a79' }}><strong>Failed:</strong> {importJob.failed}</span>
                    </div>
                    {importJob.errorMessage && (
                      <div style={{ color: '#c34d3e', marginTop: '8px', fontSize: '12px' }}>
                        Error Detail: {importJob.errorMessage}
                      </div>
                    )}
                    {importJob.status === 'COMPLETED' && (
                      <div style={{ marginTop: '16px', background: '#e2f0e9', border: '1px solid #b8dbc9', borderRadius: '8px', padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#168678', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🎉 CSV Import Job Completed!</span>
                          <span style={{ fontSize: '12px', background: '#168678', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                            {importJob.successful} Marks Ingested
                          </span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#277462', lineHeight: '1.5' }}>
                          <strong>Next Required Task:</strong> Go to <strong>Section 03 (Result Processing & Publishing)</strong> above and click <strong style={{ textDecoration: 'underline' }}>Calculate Results</strong> to aggregate marks, calculate percentages, assign letter grades (A, B, C, D, E, F), and update Pass/Fail status.
                        </p>
                        <button 
                          className="primary-button" 
                          style={{ padding: '8px 14px', fontSize: '12px' }}
                          onClick={() => {
                            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                        >
                          Go to Section 03: Calculate Results ↑
                        </button>
                      </div>
                    )}
                    {(importJob.status === 'QUEUED' || importJob.status === 'PROCESSING') && (
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          className="ghost-button" 
                          style={{ color: '#c34d3e', borderColor: '#e2a39b', background: '#fdf3f2' }}
                          onClick={async () => {
                            if (!importJob) return;
                            setBusy(true);
                            try {
                              await api.cancelImport(importJob.id);
                              setMessage(`Import job ${importJob.id} cancelled.`);
                              await pollImport(importJob.id);
                            } catch (err) {
                              setMessage(err instanceof Error ? err.message : 'Could not cancel job');
                            } finally {
                              setBusy(false);
                            }
                          }}
                          disabled={busy}
                        >
                          ⛔ Cancel Active Import Job
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
