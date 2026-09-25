import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!signIn(email, password)) {
      setError('No matching account found. Check your details or create an account.');
      return;
    }
    navigate('/');
  }

  return <AuthShell mode="login">
    <p className="kicker">SIGN IN</p>
    <h2>Good to see you.</h2>
    <p className="form-intro">Access your examination workspace and continue processing.</p>
    <form className="auth-form" onSubmit={submit}>
      <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="registrar@university.edu" required /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit">Sign in <span>→</span></button>
    </form>
  </AuthShell>;
}
