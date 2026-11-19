import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { useHealthCheck } from '../context/HealthCheckContext';
import Reminders from './Reminders';

export function RemindersPage() {
  return <Reminders />;
}

export { default as ProgressPage } from './Progress';

export function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const { streakDays, stats } = useHealthCheck();

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-8 shadow-xs max-w-2xl text-center text-sm text-[var(--hc-muted)]">
          Loading your profile…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-8 shadow-xs max-w-2xl text-center text-sm text-[var(--hc-muted)]">
          No authenticated profile found. Please sign in to view your profile.
        </div>
      </div>
    );
  }

  const isEmailVerified = Boolean(user.email_confirmed_at);
  const authProvider = user.app_metadata?.provider || 'Email';

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-xs font-bold text-[var(--hc-primary)] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-[var(--hc-primary-soft)]"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--hc-primary)] to-[var(--hc-accent)] text-white text-xl font-extrabold flex items-center justify-center shrink-0 shadow-sm shadow-[var(--hc-primary)]/20">
              {profile?.initials || 'HC'}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[var(--hc-ink)] font-manrope">
              {profile?.displayName || 'HealthCheck Member'}
            </h2>
            <p className="text-xs text-[var(--hc-muted)]">
              {user.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--hc-primary-soft)] text-xs font-bold text-[var(--hc-primary)]">
                🔥 {streakDays} Days Streak
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 border border-emerald-200">
                {isEmailVerified ? 'Verified Account' : 'Account Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="border-t border-[var(--hc-border)] pt-5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--hc-primary)] mb-3">
            Account Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)]">
              <span className="block text-[11px] font-medium text-[var(--hc-muted)]">Full Name</span>
              <span className="font-semibold text-[var(--hc-ink)]">{profile?.displayName}</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)]">
              <span className="block text-[11px] font-medium text-[var(--hc-muted)]">Email Address</span>
              <span className="font-semibold text-[var(--hc-ink)] break-all">{user.email}</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)]">
              <span className="block text-[11px] font-medium text-[var(--hc-muted)]">Member Since</span>
              <span className="font-semibold text-[var(--hc-ink)]">{profile?.memberSince}</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)]">
              <span className="block text-[11px] font-medium text-[var(--hc-muted)]">Authentication Provider</span>
              <span className="font-semibold text-[var(--hc-ink)] capitalize">{authProvider}</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)]">
              <span className="block text-[11px] font-medium text-[var(--hc-muted)]">Daily Checklist Target</span>
              <span className="font-semibold text-[var(--hc-ink)]">{stats.total} habits scheduled</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)]">
              <span className="block text-[11px] font-medium text-[var(--hc-muted)]">Account Identifier</span>
              <span className="font-mono text-[10px] text-[var(--hc-muted)]">{user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-xs font-bold text-[var(--hc-primary)] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-8 shadow-xs max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)] text-[var(--hc-ink)] flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--hc-ink)] font-manrope">App Settings</h2>
            <p className="text-xs text-[var(--hc-muted)]">Preferences, theme, and data sync</p>
          </div>
        </div>
        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)] flex items-center justify-between">
            <span className="font-semibold text-[var(--hc-ink)]">Sound and Haptic Vibrations</span>
            <span className="text-emerald-600 font-bold">Enabled</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)] flex items-center justify-between">
            <span className="font-semibold text-[var(--hc-ink)]">Circadian 30-min bedtime window</span>
            <span className="text-emerald-600 font-bold">10:45 PM – 6:45 AM</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)] flex items-center justify-between">
            <span className="font-semibold text-[var(--hc-ink)]">Design Theme</span>
            <span className="text-slate-600 font-bold">Tranquil Health (Light)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
