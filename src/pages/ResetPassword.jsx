import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { supabase } from '../auth/supabaseClient';

function authErrorMessage(error) {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('invalid')) return 'Invalid password or token.';
  if (message.includes('expired') || message.includes('otp')) return 'The reset link has expired.';
  if (message.includes('access_denied')) return 'Access denied. The reset link is invalid.';
  if (message.includes('missing')) return 'Recovery information is missing.';
  return 'Unable to reset password. Please try again.';
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Parse both query string and hash fragment for recovery parameters
  function getRecoveryParams() {
    const searchParams = new URLSearchParams(location.search);
    const hash = location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    const access_token = searchParams.get('access_token') || hashParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token') || hashParams.get('refresh_token');
    const type = searchParams.get('type') || hashParams.get('type');
    const code = searchParams.get('code') || hashParams.get('code'); // PKCE flow
    return { access_token, refresh_token, type, code };
  }

  useEffect(() => {
    // Detect Supabase OAuth error parameters from query string OR hash fragment
    // e.g. /reset-password?error=access_denied&error_code=otp_expired
    // e.g. /reset-password#error=access_denied&error_code=otp_expired
    const searchP = new URLSearchParams(location.search);
    const hashP = new URLSearchParams(location.hash.replace(/^#/, ''));
    const err = searchP.get('error') || hashP.get('error');
    const errCode = searchP.get('error_code') || hashP.get('error_code');
    const errDesc = searchP.get('error_description') || hashP.get('error_description');
    if (err || errCode) {
      const combined = `${err || ''} ${errCode || ''} ${errDesc || ''}`.trim();
      setError(authErrorMessage({ message: combined }));
      setSessionReady(false);
      return;
    }

    const { access_token, refresh_token, type, code } = getRecoveryParams();

    // Implicit flow: tokens in URL
    if (access_token && refresh_token && type === 'recovery') {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            setError(authErrorMessage(error));
            setSessionReady(false);
          } else {
            setSessionReady(true);
          }
        })
        .catch((e) => setError(authErrorMessage(e)));
      return;
    }

    // PKCE flow – exchange auth code for session
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            setError(authErrorMessage(error));
            setSessionReady(false);
          } else {
            setSessionReady(true);
          }
        })
        .catch((e) => setError(authErrorMessage(e)));
      return;
    }
    // No recovery data – keep sessionReady false
  }, [location.search, location.hash]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!sessionReady) {
      setError('Recovery session not established. Check the link.');
      return;
    }
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setNotice('Password updated! You can now sign in.');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
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
            <p className="text-xs text-[var(--hc-muted)]">Set a new password</p>
          </div>
        </div>
        <h2 className="font-manrope text-2xl font-bold text-[var(--hc-ink)]">Reset Password</h2>
        <p className="mt-1 text-sm text-[var(--hc-muted)]">Enter a new password for your account.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[var(--hc-ink)]">
            New Password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--hc-border)] px-3.5 py-2.5 font-normal outline-none focus:border-[var(--hc-primary)] focus:ring-2 focus:ring-[var(--hc-primary)]/20"
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--hc-ink)]">
            Confirm Password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--hc-border)] px-3.5 py-2.5 font-normal outline-none focus:border-[var(--hc-primary)] focus:ring-2 focus:ring-[var(--hc-primary)]/20"
            />
          </label>
          {error && (
            <>
              <p role="alert" className="text-sm text-red-700">{error}</p>
              <p className="mt-2 text-sm">
                <Link className="font-bold text-[var(--hc-primary)] hover:underline" to="/forgot-password">
                  Request a new reset link
                </Link>
              </p>
            </>
          )}
          {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="ui-button w-full rounded-xl bg-[var(--hc-primary)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Updating…' : 'Reset password'}
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
