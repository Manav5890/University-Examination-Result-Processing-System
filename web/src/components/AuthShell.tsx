import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function AuthShell({ children, mode }: { children: ReactNode; mode: 'login' | 'signup' }) {
  return (
    <main className="auth-layout">
      <section className="auth-art">
        <div className="brand-mark">EX</div>
        <p className="eyebrow">UNIVERSITY EXAMINATION SYSTEM</p>
        <h1>Calm control for high-stakes results.</h1>
        <p className="auth-copy">Coordinate sittings, component marks, and publishing decisions from one focused workspace.</p>
        <div className="art-note"><span>01</span><span>Secure academic operations</span></div>
      </section>
      <section className="auth-card">
        <div className="auth-card-top"><span className="wordmark">Exam Control Room</span><span className="auth-mode">{mode === 'login' ? 'Welcome back' : 'New account'}</span></div>
        {children}
        <p className="auth-switch">{mode === 'login' ? 'New to the control room?' : 'Already have an account?'} <Link to={mode === 'login' ? '/signup' : '/login'}>{mode === 'login' ? 'Create account' : 'Sign in'}</Link></p>
      </section>
    </main>
  );
}
