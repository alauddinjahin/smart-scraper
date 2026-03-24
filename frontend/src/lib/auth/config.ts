
export interface User {
  id:       string;
  name:     string;
  email:    string;
  role:     'admin' | 'viewer';
  avatarInitials: string;
}

export interface Session {
  user:      User;
  expiresAt: number; // Unix ms
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

interface MockUser extends User {
  _password: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id:             'usr_001',
    name:           'Admin User',
    email:          'admin@uniscraper.dev',
    role:           'admin',
    avatarInitials: 'AU',
    _password:      'admin123',
  },
  {
    id:             'usr_002',
    name:           'Md. Ala Uddin',
    email:          'ala@uniscraper.dev',
    role:           'admin',
    avatarInitials: 'MA',
    _password:      'password123',
  },
  {
    id:             'usr_003',
    name:           'Demo Viewer',
    email:          'viewer@uniscraper.dev',
    role:           'viewer',
    avatarInitials: 'DV',
    _password:      'viewer123',
  },
];

export const SESSION_COOKIE  = 'uniscraper_session';
export const SESSION_TTL_MS  = 8 * 60 * 60 * 1000; // 8 hours
export const LOGIN_REDIRECT  = '/';
export const AUTH_REDIRECT   = '/login';

export const PROTECTED_PREFIXES = ['/', '/universities', '/jobs'];
export const PUBLIC_ROUTES      = ['/login'];
