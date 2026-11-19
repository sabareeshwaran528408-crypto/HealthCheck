import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { supabase } from '../auth/supabaseClient';

function authErrorMessage(error) {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('not found') || message.includes('does not exist')) {
    return 'No account found with this email.';
  }
  if (message.includes('user not found')) {
    return 'No account found with this email.';
  }
  if (message.includes('email')) {
    return 'Please provide a valid email address.';
  }
  return 'Unable to send password reset. Please try again.';
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (resetError) throw resetError;
      setNotice('Check your inbox for a password‑reset link.');
      // optional: navigate to login after a short delay
    } catch (err) {
      setError(authErrorMessage(err));
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
            <p className="text-xs text-[var(--hc-muted)]">Reset your password</p>
          </div>
        </div>
        <h2 className="font-manrope text-2xl font-bold text-[var(--hc-ink)]">Forgot Password</h2>
        <p className="mt-1 text-sm text-[var(--hc-muted)]">Enter your email to receive a reset link.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[var(--hc-ink)]">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--hc-muted)]">
          <Link className="font-bold text-[var(--hc-primary)] hover:underline" to="/login">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
