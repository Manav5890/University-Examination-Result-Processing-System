import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../auth/AuthContext';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (values.password.length < 6) {
      setError('Use at least six characters for the password.');
      return;
    }
    signUp(values);
    navigate('/');
  }

  return <AuthShell mode="signup">
    <p className="kicker">CREATE ACCOUNT</p>
    <h2>Start the workspace.</h2>
    <p className="form-intro">A lightweight local account for this evaluation environment.</p>
    <form className="auth-form" onSubmit={submit}>
      <label>Your name<input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Dr. Maya Patel" required /></label>
      <label>Work email<input type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="registrar@university.edu" required /></label>
      <label>Password<input type="password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="At least 6 characters" required /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit">Create account <span>→</span></button>
    </form>
  </AuthShell>;
}
