import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export function AppShell({ children }: { children: ReactNode }) {
  const { account, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-mark">EX</div>
        <div className="side-brand">
          <strong>Exam<br />Control Room</strong>
          <span>Academic operations</span>
        </div>
        <nav style={{ display: 'grid', gap: '8px' }}>
          <Link 
            to="/" 
            style={{ 
              padding: '12px 13px', 
              borderRadius: '7px', 
              color: location.pathname === '/' ? 'white' : '#9ab2ae', 
              background: location.pathname === '/' ? '#25474a' : 'transparent',
              textDecoration: 'none', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🏠 Workspace Dashboard
          </Link>
          <Link 
            to="/results" 
            style={{ 
              padding: '12px 13px', 
              borderRadius: '7px', 
              color: location.pathname === '/results' ? 'white' : '#9ab2ae', 
              background: location.pathname === '/results' ? '#25474a' : 'transparent',
              textDecoration: 'none', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📊 Results & Sessions Explorer
          </Link>
        </nav>
        <div className="sidebar-foot" style={{ marginTop: 'auto' }}>
          <span className="status-dot"></span>
          <span>PostgreSQL API Connected</span>
        </div>
      </aside>
      <div className="app-content">
        <header className="app-header">
          <div>
            <p className="eyebrow">OPERATIONS / EXAMINATION CYCLE</p>
            <h1>Good morning, {account?.name.split(' ')[0]}.</h1>
          </div>
          <button className="ghost-button" onClick={signOut}>Sign out</button>
        </header>
        {children}
      </div>
    </div>
  );
}
