import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { clearAuth, getUser, type AuthUser } from '../services/auth';


interface AuthContextType {
  profile: AuthUser | null;
  loading: boolean;
  signOut: () => void;
  setProfile: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getUser();
    setProfile(stored);
    setLoading(false);
  }, []);

  const signOut = () => {
    clearAuth();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signOut,setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
