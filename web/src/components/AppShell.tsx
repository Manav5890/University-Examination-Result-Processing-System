import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

export function AppShell({ children }: { children: ReactNode }) {
  const { account, signOut } = useAuth();
  function jumpTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return <div className="app-frame">
    <aside className="sidebar">
      <div className="brand-mark">EX</div>
      <div className="side-brand"><strong>Exam<br />Control Room</strong><span>Academic operations</span></div>
      <nav><button className="nav-button active" type="button" onClick={() => jumpTo('workspace')}>Workspace</button><button className="nav-button" type="button" onClick={() => jumpTo('marks')}>Marks register</button><button className="nav-button" type="button" onClick={() => jumpTo('results')}>Results</button><button className="nav-button" type="button" onClick={() => jumpTo('imports')}>Imports</button></nav>
      <div className="sidebar-foot"><span className="status-dot"></span><span>API connected</span></div>
    </aside>
    <div className="app-content">
      <header className="app-header"><div><p className="eyebrow">OPERATIONS / EXAMINATION CYCLE</p><h1>Good morning, {account?.name.split(' ')[0]}.</h1></div><button className="ghost-button" onClick={signOut}>Sign out</button></header>
      {children}
    </div>
  </div>;
}
