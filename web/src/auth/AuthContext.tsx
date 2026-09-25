import { createContext, useContext, useState, type ReactNode } from 'react';

type Account = { name: string; email: string; password: string };
type AuthContextValue = { account: Account | null; signIn: (email: string, password: string) => boolean; signUp: (account: Account) => void; signOut: () => void };

const storageKey = 'exam-control-room-account';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  });

  function signUp(nextAccount: Account) {
    localStorage.setItem(storageKey, JSON.stringify(nextAccount));
    setAccount(nextAccount);
  }

  function signIn(email: string, password: string) {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return false;
    const nextAccount = JSON.parse(stored) as Account;
    if (nextAccount.email !== email || nextAccount.password !== password) return false;
    setAccount(nextAccount);
    return true;
  }

  function signOut() {
    setAccount(null);
  }

  return <AuthContext.Provider value={{ account, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
