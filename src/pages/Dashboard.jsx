import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Sparkles, 
  SlidersHorizontal, 
  Plus, 
  Check, 
  TrendingUp, 
  CheckSquare, 
  ArrowRight, 
  Bell, 
  Droplet, 
  Moon, 
  Footprints, 
  Brain,
  Lightbulb,
  AlarmClock,
  Activity,
  Utensils
} from 'lucide-react';
import { useHealthCheck } from '../context/HealthCheckContext';
import { useAuth } from '../auth/useAuth';
import { getTimeBasedGreeting } from '../utils/user';
import ProgressRing from '../components/common/ProgressRing';
import WeeklyRhythmChart from '../components/common/WeeklyRhythmChart';
import AnimatedNumber from '../components/common/AnimatedNumber';

export default function Dashboard() {
  const { profile } = useAuth();
  const greeting = getTimeBasedGreeting();
  const firstName = profile?.firstName || 'Friend';

  const { 
    habits, 
    toggleHabit, 
    stats, 
    streakDays, 
    setIsQuickCheckInOpen,
    activeDate,
    weeklyProgress
  } = useHealthCheck();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Get pinned habits for Today's Checklist card
  const pinnedHabits = habits.filter(h => h.pinned).slice(0, 5);

  const getHabitIcon = (iconName) => {
    switch (iconName) {
      case 'alarm': return <AlarmClock className="w-4 h-4 text-slate-400" />;
      case 'droplet': return <Droplet className="w-4 h-4 text-slate-400" />;
      case 'utensils': return <Utensils className="w-4 h-4 text-slate-400" />;
      case 'activity': return <Activity className="w-4 h-4 text-slate-400" />;
      default: return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Banner & Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Pills row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[var(--hc-border)] text-xs font-semibold text-[var(--hc-ink)] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[var(--hc-primary)]" />
              {new Date(`${activeDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--hc-primary-soft)] border border-[var(--hc-border)] text-xs font-semibold text-[var(--hc-primary)]">
              <Sparkles className="w-3.5 h-3.5" />
              Every small step counts.
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--hc-ink)] tracking-tight font-manrope">
            {greeting}, {firstName} 👋
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="ui-button inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[var(--hc-border)] text-sm font-semibold text-[var(--hc-ink)] hover:bg-slate-50 transition-all shadow-2xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-[var(--hc-muted)]" />
              <span>{categoryFilter === 'All' ? 'Filter by Category' : categoryFilter}</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--hc-border)] rounded-xl shadow-lg z-20 py-1">
                {['All', 'Morning Routine', 'Daytime Energy', 'Evening Wind-Down', 'Mental Wellbeing'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-[var(--hc-bg)] hover:text-[var(--hc-primary)]"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsQuickCheckInOpen(true)}
            className="ui-button inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--hc-primary)] text-white text-sm font-semibold hover:bg-[var(--hc-primary-hover)] shadow-sm shadow-[var(--hc-primary)]/20 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Quick Check-In</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (~60%) & Right Column (~40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Today's Progress (Hero Card) */}
          <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hc-primary)]">
                  VITALS & CONSISTENCY
                </span>
                <h2 className="text-2xl font-bold text-[var(--hc-ink)] tracking-tight font-manrope">
                  Today's Progress
                </h2>
                <p className="text-sm text-[var(--hc-muted)] leading-relaxed max-w-sm">
                  You are half-way there! Finishing your afternoon hydration and evening walk will keep your streak alive.
                </p>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--hc-primary-soft)] text-xs font-semibold text-[var(--hc-primary)]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Routine pacing: Optimum tier
                  </span>
                </div>
              </div>

              {/* Circular Progress Gauge */}
              <div className="flex flex-col items-center">
                <ProgressRing percentage={stats.percentage} size={140} strokeWidth={13} />
                <span className="text-xs font-bold text-[var(--hc-ink)] mt-2">
                  <AnimatedNumber value={stats.completed} /> / {stats.total} items
                </span>
              </div>
            </div>

            {/* Bottom 3 Metric Tiers */}
            <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-[var(--hc-border)]/70 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--hc-muted)]">
                  CONSISTENCY
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Check className="w-4 h-4 text-[var(--hc-primary)] stroke-[2.5]" />
                  <span className="text-sm font-bold text-[var(--hc-ink)]">
                    <AnimatedNumber value={streakDays} /> Days Streak
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--hc-muted)]">
                  WEEKLY AVERAGE
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-[var(--hc-primary)] stroke-[2]" />
                  <span className="text-sm font-bold text-[var(--hc-ink)]">
                    {weeklyProgress?.averagePercentage !== undefined ? `${weeklyProgress.averagePercentage}% Ratio` : '67% Ratio'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--hc-muted)]">
                  LOGGED TODAY
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <CheckSquare className="w-4 h-4 text-[var(--hc-primary)] stroke-[2]" />
                  <span className="text-sm font-bold text-[var(--hc-ink)]">
                    <AnimatedNumber value={stats.completed} /> Tasks
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Today's Checklist */}
          <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--hc-ink)] font-manrope">
                  Today's Checklist
                </h3>
                <p className="text-xs text-[var(--hc-muted)]">Complete your habits one step at a time.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--hc-surface-muted)] text-[var(--hc-primary)]">
                {pinnedHabits.filter(h => h.completed).length} / {pinnedHabits.length} pinned
              </span>
            </div>

            {/* Habit Items */}
            <div className="space-y-2.5">
              {pinnedHabits.map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    habit.completed
                      ? 'bg-[var(--hc-primary-soft)]/70 border-[var(--hc-border)]'
                      : 'bg-[var(--hc-bg)] border-[var(--hc-border)] hover:border-[var(--hc-border)]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Checkbox Node */}
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        habit.completed
                          ? 'bg-[var(--hc-primary)] text-white shadow-xs'
                          : 'border-2 border-[var(--hc-border)] bg-white hover:border-[var(--hc-primary)]'
                      }`}
                    >
                      {habit.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div>
                      <h4
                        className={`text-sm font-bold font-manrope ${
                          habit.completed ? 'text-[var(--hc-ink)] line-through opacity-80' : 'text-[var(--hc-ink)]'
                        }`}
                      >
                        {habit.title}
                      </h4>
                      <p className="text-xs text-[var(--hc-muted)]">{habit.subtitle}</p>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg text-slate-400">
                    {getHabitIcon(habit.icon)}
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist Card Footer */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-[var(--hc-border)] text-xs">
              <Link
                to="/checklist"
                className="inline-flex items-center gap-1.5 font-bold text-[var(--hc-primary)] hover:text-[var(--hc-primary-hover)] transition-colors"
              >
                <span>View Full Checklist ({stats.total} items)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[var(--hc-muted)]">Updated 2m ago</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Today's Recommendation */}
          <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[var(--hc-primary)]" />
                <h3 className="text-sm font-bold text-[var(--hc-ink)] font-manrope">
                  Today's Recommendation
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]">
                Recommended for You
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--hc-bg)] border border-[var(--hc-border)] space-y-2.5">
              <h4 className="text-sm font-bold text-[var(--hc-ink)] leading-snug font-manrope">
                Take a short movement break after your study session
              </h4>
              <p className="text-xs text-[var(--hc-muted)] leading-relaxed">
                Research shows gentle walking every 50 minutes boosts memory retention, stabilizes glucose, and reduces spine fatigue.
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--hc-border)] text-[11px] font-semibold text-[var(--hc-ink)]">
                  Cognitive Peak
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[var(--hc-border)] text-[11px] font-semibold text-[var(--hc-muted)]">
                  5 min duration
                </span>
              </div>
            </div>

            <div className="pt-4 text-right">
              <Link
                to="/recommendations"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--hc-primary)] hover:text-[var(--hc-primary-hover)]"
              >
                <span>View All Recommendations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card: Next Reminder */}
          <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--hc-primary)]" />
                <h3 className="text-sm font-bold text-[var(--hc-ink)] font-manrope">
                  Next Reminder
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[var(--hc-primary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--hc-primary-soft)] border border-[var(--hc-border)] flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--hc-primary)] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Droplet className="w-5 h-5 fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--hc-ink)] flex items-center gap-1.5">
                    <span>Water Break</span>
                  </h4>
                  <span className="text-xs font-bold text-[var(--hc-primary)]">10:30 AM</span>
                </div>
                <p className="text-xs text-[var(--hc-muted)] mt-0.5">
                  Take a short water break — hydrate with at least 250ml.
                </p>
                <p className="text-[11px] font-medium text-[var(--hc-muted)] mt-1.5">
                  Schedule: Daily • Next in 42 minutes
                </p>
              </div>
            </div>

            <div className="pt-3 text-right">
              <Link
                to="/reminders"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--hc-primary)] hover:text-[var(--hc-primary-hover)]"
              >
                <span>Manage Reminders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card: Weekly Rhythm Overview */}
          <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--hc-ink)] font-manrope">
                  Weekly Rhythm Overview
                </h3>
                <p className="text-[11px] text-[var(--hc-muted)]">Completion trajectory (7 days)</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--hc-surface-muted)] text-[var(--hc-primary)]">
                Week 41
              </span>
            </div>

            <WeeklyRhythmChart rhythmData={weeklyProgress?.days} />
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Biometric Metric Pods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sleep Pod */}
        <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-4 sm:p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[var(--hc-primary-soft)] text-[var(--hc-primary)] flex items-center justify-center shrink-0">
            <Moon className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--hc-muted)]">Sleep Rest Score</span>
            <div className="text-base sm:text-lg font-bold text-[var(--hc-ink)] font-manrope">
              8.2 hrs • 91% Restful
            </div>
          </div>
        </div>

        {/* Steps Pod */}
        <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-4 sm:p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[var(--hc-primary-soft)] text-[var(--hc-accent)] flex items-center justify-center shrink-0">
            <Footprints className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--hc-muted)]">Daily Activity</span>
            <div className="text-base sm:text-lg font-bold text-[var(--hc-ink)] font-manrope">
              6,420 / 10,000 Steps
            </div>
          </div>
        </div>

        {/* Mindfulness Pod */}
        <div className="ui-card bg-white rounded-2xl border border-[var(--hc-border)] p-4 sm:p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[var(--hc-primary-soft)] text-[#4F46E5] flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--hc-muted)]">Mindfulness Sessions</span>
            <div className="text-base sm:text-lg font-bold text-[var(--hc-ink)] font-manrope">
              1 Completed Today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
