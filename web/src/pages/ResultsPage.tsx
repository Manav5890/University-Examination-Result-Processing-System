import { useEffect, useState } from 'react';
import { api, type Examination, type Result } from '../api/client';
import { AppShell } from '../components/AppShell';

export function ResultsPage() {
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [message, setMessage] = useState<string>('Loading examination sessions...');
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    void loadExaminations();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      const found = examinations.find((item) => item.id === selectedExamId) || null;
      setSelectedExam(found);
      void fetchResultsForExam(selectedExamId);
    }
  }, [selectedExamId, examinations]);

  async function loadExaminations() {
    try {
      const data = await api.getExaminations();
      setExaminations(data);
      if (data.length > 0) {
        setSelectedExamId(data[0].id);
      }
      setMessage(`Loaded ${data.length} examination sessions from PostgreSQL.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load examinations');
    }
  }

  async function fetchResultsForExam(examId: string) {
    setBusy(true);
    try {
      const data = await api.getResults(examId);
      setResults(data);
      setMessage(`Fetched ${data.length} student result records for examination.`);
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : 'Could not fetch results');
    } finally {
      setBusy(false);
    }
  }

  async function calculateResults() {
    if (!selectedExamId) return;
    setBusy(true);
    try {
      const updatedResults = await api.calculate(selectedExamId);
      setResults(updatedResults);
      await loadExaminations();
      setMessage(`Successfully calculated ${updatedResults.length} student results! Status updated to CALCULATED.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Calculation failed');
    } finally {
      setBusy(false);
    }
  }

  async function publishResults() {
    if (!selectedExamId) return;
    setBusy(true);
    try {
      const published = await api.publish(selectedExamId);
      setResults(published);
      await loadExaminations();
      setMessage(`Successfully published ${published.length} student results! Status updated to PUBLISHED.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Publishing failed');
    } finally {
      setBusy(false);
    }
  }

  // Statistics Computations
  const totalPassed = results.filter((r) => r.status === 'PASS').length;
  const totalFailed = results.filter((r) => r.status === 'FAIL').length;
  const gradeCounts = {
    A: results.filter((r) => r.grade === 'A').length,
    B: results.filter((r) => r.grade === 'B').length,
    C: results.filter((r) => r.grade === 'C').length,
    D: results.filter((r) => r.grade === 'D').length,
    E: results.filter((r) => r.grade === 'E').length,
    F: results.filter((r) => r.grade === 'F').length,
  };

  const filteredResults = results.filter((r) => {
    const matchesGrade = filterGrade === 'ALL' || r.grade === filterGrade;
    const matchesSearch = !searchQuery || JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  return (
    <AppShell>
      <section className="dashboard">
        {/* Header Banner */}
        <div style={{ background: '#172b32', color: '#f5f6ec', padding: '24px', borderRadius: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: '#249b8b', letterSpacing: '0.1em' }}>
            RESULTS EXPLORER & ANALYTICS
          </span>
          <h2 style={{ fontSize: '24px', margin: '4px 0 8px 0', color: '#fff', letterSpacing: '-0.03em' }}>
            Examination Session Results Center
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#b9d5d0', maxWidth: '850px', lineHeight: '1.5' }}>
            Select any examination session (including 10,000 and 100,000 scale test sittings) to trigger calculation, publish grades, and inspect complete grade sheets.
          </p>
        </div>

        {/* Status Notification */}
        <div className="status-banner">
          <span className="status-dot"></span>
          <strong>Status:</strong> {message}
        </div>

        {/* Examination Selector & Controls Card */}
        <section className="dashboard-card">
          <div className="card-title">
            <div>
              <span className="section-number">SESSION SELECTOR</span>
              <h2>Select Examination Session</h2>
            </div>
            <span className="tag">Multi-Session Support</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#687a79', marginBottom: '8px', fontWeight: 'bold' }}>
                Choose Examination Sitting:
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '7px',
                  border: '1px solid #d6e0dc',
                  background: '#fbfcfa',
                  font: '600 13px Manrope, sans-serif',
                  color: '#172b32',
                }}
              >
                {examinations.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.status}) — ID: {exam.id.slice(0, 8)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedExam && (
              <div style={{ background: '#f8faf9', padding: '16px', borderRadius: '8px', border: '1px solid #dbe5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Session Status:</span>
                  <strong style={{ color: '#168678' }}>{selectedExam.status}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Total Calculated Results:</span>
                  <strong>{results.length.toLocaleString()} records</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button className="primary-button" disabled={busy} onClick={calculateResults}>
                    {busy ? 'Calculating...' : 'Calculate Results'}
                  </button>
                  <button className="secondary-button" disabled={busy || results.length === 0} onClick={publishResults}>
                    Publish Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Analytics & Grade Distribution */}
        {results.length > 0 && (
          <section className="dashboard-card">
            <div className="card-title">
              <div>
                <span className="section-number">ANALYTICS</span>
                <h2>Grade Distribution & Pass Ratio</h2>
              </div>
              <span className="tag">Summary Statistics</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#e2f0e9', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <small style={{ color: '#277462', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>PASSED</small>
                <strong style={{ fontSize: '20px', color: '#168678' }}>{totalPassed.toLocaleString()}</strong>
              </div>
              <div style={{ background: '#fdf3f2', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <small style={{ color: '#c34d3e', display: 'block', fontSize: '11px', fontWeight: 'bold' }}>FAILED</small>
                <strong style={{ fontSize: '20px', color: '#c34d3e' }}>{totalFailed.toLocaleString()}</strong>
              </div>
              {Object.entries(gradeCounts).map(([grade, count]) => (
                <div key={grade} style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #dbe5e1' }}>
                  <small style={{ color: '#687a79', display: 'block', fontSize: '11px' }}>GRADE {grade}</small>
                  <strong style={{ fontSize: '18px' }}>{count.toLocaleString()}</strong>
                </div>
              ))}
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by student ID or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '240px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #d6e0dc',
                  fontSize: '13px',
                }}
              />
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #d6e0dc',
                  fontSize: '13px',
                  background: '#fff',
                }}
              >
                <option value="ALL">All Grades (A - F)</option>
                <option value="A">Grade A (≥ 90%)</option>
                <option value="B">Grade B (≥ 80%)</option>
                <option value="C">Grade C (≥ 70%)</option>
                <option value="D">Grade D (≥ 60%)</option>
                <option value="E">Grade E (≥ 50%)</option>
                <option value="F">Grade F (&lt; 50%)</option>
              </select>
            </div>

            {/* Results Data Table */}
            <div className="result-table">
              <div className="result-head">
                <span>Student ID / Roll No.</span>
                <span>Total Marks</span>
                <span>Percentage</span>
                <span>Grade</span>
                <span>Status</span>
              </div>
              {filteredResults.slice(0, 100).map((r, i) => (
                <div className="result-row" key={i}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>{r.studentId}</span>
                  <strong>{r.totalMarks} / {r.maximumMarks}</strong>
                  <span>{r.percentage}%</span>
                  <b style={{ color: r.grade === 'F' ? '#c34d3e' : '#168678' }}>{r.grade}</b>
                  <span style={{ color: r.status === 'PASS' ? '#168678' : '#c34d3e', fontWeight: 'bold' }}>{r.status}</span>
                </div>
              ))}
            </div>

            {filteredResults.length > 100 && (
              <div style={{ textAlign: 'center', marginTop: '16px', color: '#687a79', fontSize: '12px' }}>
                Showing top 100 of {filteredResults.length.toLocaleString()} calculated results.
              </div>
            )}
          </section>
        )}
      </section>
    </AppShell>
  );
}
