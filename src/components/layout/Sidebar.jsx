import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Compass, 
  Bell, 
  TrendingUp, 
  User, 
  Settings, 
  HelpCircle, 
  Moon, 
  LogOut,
  HeartPulse,
  X
} from 'lucide-react';
import { useHealthCheck } from '../../context/HealthCheckContext';
import { useAuth } from '../../auth/useAuth';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { stats } = useHealthCheck();
  const { signOut, profile } = useAuth();
  const [signOutError, setSignOutError] = React.useState('');

  async function handleSignOut() {
    setSignOutError('');
    try {
      await signOut();
    } catch {
      setSignOutError('Could not sign out. Please try again.');
    }
  }

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen, setMobileOpen]);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      to: '/checklist', 
      label: 'Daily Checklist', 
      icon: CheckCircle2, 
      badge: `${stats.completed}/${stats.total}`, 
      badgeColor: 'bg-[var(--hc-accent)]/15 text-[var(--hc-primary)]' 
    },
    { to: '/recommendations', label: 'Recommendations', icon: Compass },
    { to: '/reminders', label: 'Reminders', icon: Bell, badge: '3', badgeColor: 'bg-[#FFDAD6] text-[#93000A]' },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <button
        type="button"
        aria-label="Close sidebar"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        aria-label="Main navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[var(--hc-bg)] border-r border-[var(--hc-border)] flex flex-col justify-between py-6 px-4 transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="flex items-center justify-between px-3 mb-8">
            <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--hc-primary)] to-[var(--hc-accent)] flex items-center justify-center text-white shadow-sm shadow-[var(--hc-primary)]/20 group-hover:scale-105 transition-transform">
                <HeartPulse className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--hc-ink)] font-manrope">
                HealthCheck
              </span>
            </NavLink>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="ui-button lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ease-out ${
                    isActive
                      ? 'translate-x-0.5 bg-[var(--hc-primary)] text-white shadow-xs font-semibold'
                      : 'text-[var(--hc-muted)] hover:text-[var(--hc-ink)] hover:bg-[var(--hc-surface-muted)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white stroke-[2.2]' : 'text-[var(--hc-muted)]'}`} />
                      <span className="transition-transform duration-200 group-hover:translate-x-0.5">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Utility Menu & User Profile */}
        <div className="pt-4 border-t border-[var(--hc-border)] space-y-1">
          <NavLink
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-[var(--hc-surface-muted)] transition-colors group mb-1.5"
            title={`View profile for ${profile?.displayName || 'User'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--hc-primary)] to-[var(--hc-accent)] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
              {profile?.initials || 'HC'}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-[var(--hc-ink)] truncate font-manrope group-hover:text-[var(--hc-primary)]">
                {profile?.displayName || 'HealthCheck Member'}
              </p>
              <p className="text-[11px] text-[var(--hc-muted)] truncate">
                {profile?.email || 'Logged in'}
              </p>
            </div>
          </NavLink>

          <NavLink
            to="/help"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--hc-muted)] hover:text-[var(--hc-ink)] hover:bg-[var(--hc-surface-muted)] transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-[var(--hc-muted)]" />
            <span>Help & Support</span>
          </NavLink>

          <button
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--hc-muted)] hover:text-[var(--hc-ink)] hover:bg-[var(--hc-surface-muted)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-[var(--hc-muted)]" />
              <span>Theme Mode</span>
            </div>
            <div className="w-8 h-4 rounded-full bg-[var(--hc-border)] flex items-center px-0.5">
              <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
            </div>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          {signOutError && <p role="alert" className="px-3.5 text-xs text-rose-700">{signOutError}</p>}
        </div>
      </aside>
    </>
  );
}
