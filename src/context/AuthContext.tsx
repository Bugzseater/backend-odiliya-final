// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  email: string;
  role: 'admin' | 'editor';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users - in production, this should be in Firebase Auth
const VALID_USERS = [
  { email: 'admin@gmail.com', password: 'admin123', role: '' as const },
  { email: 'odiliya@gmail.com', password: 'odiliya123', role: 'editor' as const }
];

// Role-based access control
const ROLE_PERMISSIONS = {
  admin: [
    '/',
    '/about',
    '/contact',
    '/news',
    '/land',
    '/projects',
    '/projects-inquiries',
    '/gallery',
    '/meta',
    '/client-management'
  ],
  editor: [
    '/',
    '/about',
    '/contact',
    '/news',
    '/land',
    '/projects',
    '/projects-inquiries',
    '/gallery',
    '/client-management'
    // '/meta' is intentionally excluded
  ]
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Find user
    const foundUser = VALID_USERS.find(
      u => u.email === email && u.password === password
    );

    if (foundUser) {
      const userData = { email: foundUser.email, role: foundUser.role };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const hasAccess = (path: string): boolean => {
    if (!user) return false;
    
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions.includes(path);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};