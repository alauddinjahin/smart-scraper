'use client';

import { useState, useEffect, type FormEvent, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, Building2, AlertCircle } from 'lucide-react';

interface FormState {
  email:    string;
  password: string;
}

interface FieldErrors {
  email?:    string;
  password?: string;
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return errors;
}

const DEMO_ACCOUNTS = [
  { label: 'Admin',  email: 'admin@uniscraper.dev',  password: 'admin123'    },
  { label: 'You',    email: 'ala@uniscraper.dev',     password: 'password123' },
  { label: 'Viewer', email: 'viewer@uniscraper.dev',  password: 'viewer123'   },
];

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/';
  const emailRef     = useRef<HTMLInputElement>(null);

  const [form,         setForm]         = useState<FormState>({ email: '', password: '' });
  const [fieldErrors,  setFieldErrors]  = useState<FieldErrors>({});
  const [serverError,  setServerError]  = useState<string | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched,      setTouched]      = useState<{ email?: boolean; password?: boolean }>({});

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;
    const errs = validateForm(form);
    const relevant: FieldErrors = {};
    if (touched.email)    relevant.email    = errs.email;
    if (touched.password) relevant.password = errs.password;
    setFieldErrors(relevant);
  }, [form, touched]);

  function handleChange(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setServerError(null);
  }

  function handleBlur(field: keyof FormState) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setTouched({ email: true, password: true });
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const body = await res.json().catch(() => ({
        success: false,
        message: 'Unexpected response from server',
      }));

      if (!res.ok || !body.success) {
        setServerError(body?.message ?? 'Login failed. Please try again.');
        return;
      }

      router.push(from === '/login' ? '/' : from);
      router.refresh(); // flush RSC cache so layout picks up new session

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setServerError(
        msg.toLowerCase().includes('fetch')
          ? 'Cannot connect to the server. Check your connection.'
          : 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function fillDemo(email: string, password: string) {
    setForm({ email, password });
    setFieldErrors({});
    setServerError(null);
    setTouched({});
  }

  const inputBase = [
    'w-full h-10 rounded-[var(--radius-md)] border px-3 text-sm',
    'bg-[var(--bg-surface)] text-[var(--text-primary)]',
    'placeholder:text-[var(--text-tertiary)]',
    'transition-colors duration-150 outline-none',
    'focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-30 focus:border-[var(--brand)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-4 login-field">
          <div
            className="w-12 h-12 rounded-[var(--radius-xl)] flex items-center justify-center mb-4"
            style={{ background: 'var(--brand)' }}
          >
            <Building2 size={22} color="white" strokeWidth={2} />
          </div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Smart Scraper
          </h1>
        </div>

        {/* Card */}
        <div
          className="login-card rounded-[var(--radius-xl)] border p-8"
          style={{
            background:  'var(--bg-surface)',
            borderColor: 'var(--border)',
            boxShadow:   'var(--shadow-md)',
            // opacity:      0,
          }}
        >
          {/* Server error banner */}
          {serverError && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)] border mb-5 text-sm"
              style={{
                background:  'var(--danger-subtle)',
                borderColor: 'var(--danger)',
                color:       'var(--danger-text)',
              }}
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="login-field mb-4">
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email address
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={inputBase}
                style={{
                  borderColor: fieldErrors.email ? 'var(--danger)' : 'var(--border-md)',
                }}
              />
              {fieldErrors.email && (
                <p
                  id="email-error"
                  className="text-xs mt-1"
                  style={{ color: 'var(--danger-text)' }}
                  role="alert"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="login-field mb-6">
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`${inputBase} pr-10`}
                  style={{
                    borderColor: fieldErrors.password ? 'var(--danger)' : 'var(--border-md)',
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p
                  id="password-error"
                  className="text-xs mt-1"
                  style={{ color: 'var(--danger-text)' }}
                  role="alert"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-field w-full h-10 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{ background: 'var(--brand)', color: '#fff' }}
            >
              {isLoading ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Sign in
                </>
              )}
            </button>

          </form>
        </div>

        {/* Demo accounts */}
        <div
          className="mt-4 rounded-[var(--radius-lg)] border p-4 login-field"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <p
            className="text-xs font-medium mb-3 uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Demo accounts — click to autofill
          </p>
          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email, account.password)}
                disabled={isLoading}
                className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] border text-left transition-colors duration-100 disabled:opacity-50"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-cardshape-title)' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = 'var(--brand)';
                  el.style.background  = 'var(--bg-subtle)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = 'var(--border)';
                  el.style.background  = 'var(--bg-subtle)';
                }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {account.label}
                    {' '}
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
                      — {account.email}
                    </span>
                  </p>
                  <p
                    className="text-xs font-mono mt-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {account.password}
                  </p>
                </div>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 shrink-0"
                  style={{
                    background: 'var(--brand-subtle)',
                    color:      'var(--brand-text)',
                  }}
                >
                  Use
                </span>
              </button>
            ))}
          </div>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: 'var(--text-tertiary)' }}
        >
          UniScraper · Assignment Demo · Not for production use
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--bg-page)' }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--brand)' }}
            aria-label="Loading"
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
