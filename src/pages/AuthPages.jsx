import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

function authErrorMessage(error) {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (message.includes('invalid login credentials')) {
    return 'The email or password is incorrect.';
  }
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return 'Choose a stronger password and try again.';
  }
  return 'Authentication could not be completed. Please try again.';
}

function AuthForm({ mode }) {
  const isSignUp = mode === 'signup';
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      if (isSignUp) {
        const result = await signUp(email.trim(), password);
        if (result.session) {
          navigate('/dashboard', { replace: true });
        } else {
          setNotice('Check your inbox for a confirmation link before signing in.');
        }
      } else {
        await signIn(email.trim(), password);
        navigate('/dashboard', { replace: true });
      }
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--hc-bg)] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[var(--hc-border)] bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]">
            <HeartPulse className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-manrope text-xl font-bold text-[var(--hc-ink)]">HealthCheck</h1>
            <p className="text-xs text-[var(--hc-muted)]">Your personal wellness space</p>
          </div>
        </div>

        <h2 className="font-manrope text-2xl font-bold text-[var(--hc-ink)]">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="mt-1 text-sm text-[var(--hc-muted)]">
          {isSignUp ? 'Sign up to start your wellness journey.' : 'Sign in to continue to HealthCheck.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[var(--hc-ink)]">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--hc-border)] px-3.5 py-2.5 font-normal outline-none focus:border-[var(--hc-primary)] focus:ring-2 focus:ring-[var(--hc-primary)]/20"
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--hc-ink)]">
            Password
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--hc-border)] px-3.5 py-2.5 font-normal outline-none focus:border-[var(--hc-primary)] focus:ring-2 focus:ring-[var(--hc-primary)]/20"
            />
          </label>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="ui-button w-full rounded-xl bg-[var(--hc-primary)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--hc-muted)]">
          {isSignUp ? 'Already have an account? ' : 'New to HealthCheck? '}
          <Link
            className="font-bold text-[var(--hc-primary)] hover:underline"
            to={isSignUp ? '/login' : '/signup'}
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        {/* Forgot Password link placed outside the form for safe navigation */}
        { !isSignUp && (
          <p className="mt-4 text-center text-sm text-[var(--hc-muted)]">
            <Link
              className="font-bold text-[var(--hc-primary)] hover:underline"
              to="/forgot-password"
            >
              Forgot Password?
            </Link>
          </p>
        )}

      </section>
    </main>
  );
}

export function LoginPage() {
  return <AuthForm mode="login" />;
}

export function SignUpPage() {
  return <AuthForm mode="signup" />;
}
