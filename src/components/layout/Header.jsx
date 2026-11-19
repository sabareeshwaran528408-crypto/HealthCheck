import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Bell, 
  Flame, 
  Menu,
  LogOut,
} from 'lucide-react';
import { useHealthCheck } from '../../context/HealthCheckContext';
import { useAuth } from '../../auth/useAuth';

export default function Header({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const { searchQuery, setSearchQuery, streakDays, activeDate } = useHealthCheck();
  const { signOut, profile } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  async function handleSignOut() {
    setSignOutError('');
    try {
      await signOut();
    } catch {
      setSignOutError('Could not sign out. Please try again.');
    }
  }

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/checklist':
        return { parent: 'HealthCheck', current: 'Daily Protocol' };
      case '/recommendations':
        return { parent: 'HealthCheck', current: 'Wellness Recommendations' };
      case '/reminders':
        return { parent: 'HealthCheck', current: 'Reminders' };
      case '/progress':
        return { parent: 'HealthCheck', current: 'Progress' };
      case '/dashboard':
      default:
        return { parent: 'HealthCheck', current: 'Overview' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-30 bg-[var(--hc-bg)]/90 backdrop-blur-md border-b border-[var(--hc-border)] px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left Section: Mobile Menu + Breadcrumbs & Date Pill */}
        <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
          <button
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            className="ui-button lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[var(--hc-muted)]">
            <span>{pageInfo.parent}</span>
            <span className="text-slate-300">›</span>
            <span className="text-[var(--hc-ink)]">{pageInfo.current}</span>
          </div>

          {/* Date pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[var(--hc-border)] text-xs font-medium text-[var(--hc-ink)] shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[var(--hc-primary)]" />
            <span className="hidden sm:inline">{new Date(`${activeDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="sm:hidden">{new Date(`${activeDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Right Section: Search Bar & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative hidden md:block w-64 lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hc-muted)]" />
            <input
              type="text"
              placeholder="Search habits, vitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-white border border-[var(--hc-border)] rounded-xl text-[var(--hc-ink)] placeholder-[var(--hc-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hc-primary)]/20 focus:border-[var(--hc-primary)] transition-all shadow-2xs"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="ui-button relative p-2 rounded-xl bg-white border border-[var(--hc-border)] text-slate-600 hover:text-[var(--hc-primary)] hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Bell className={`w-4 h-4 transition-transform duration-200 ${notificationsOpen ? 'scale-105' : ''}`} />
            {!notificationsOpen && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--hc-accent)] ring-2 ring-white" />}
          </button>
          {notificationsOpen && (
            <div role="dialog" aria-label="Notifications" className="notification-popover absolute right-0 top-full z-40 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--hc-border)] bg-white p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-manrope text-sm font-bold text-[var(--hc-ink)]">Notifications</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--hc-muted)]">You’re all caught up. Keep taking small steps for your wellbeing.</p>
                </div>
                <button type="button" onClick={() => setNotificationsOpen(false)} className="ui-button rounded-lg px-2 py-1 text-xs font-semibold text-[var(--hc-primary)] hover:bg-[var(--hc-primary-soft)]">Done</button>
              </div>
            </div>
          )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-slate-100/60"
              title={`View ${profile?.displayName || 'User'} Profile`}
            >
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs sm:text-sm font-bold text-[var(--hc-ink)] leading-tight font-manrope max-w-[140px] truncate">
                  {profile?.displayName || 'HealthCheck Member'}
                </span>
                <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-[var(--hc-primary)]">
                  <span>Streak: {streakDays} Days</span>
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--hc-primary)] to-[var(--hc-accent)] text-xs font-bold text-white shadow-2xs">
                {profile?.initials || 'HC'}
              </div>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title={signOutError || 'Sign out'}
              className="ui-button rounded-xl border border-[var(--hc-border)] bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-[var(--hc-primary)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
