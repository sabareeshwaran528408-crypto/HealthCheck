import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  Flame,
  Award,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { useHealthCheck } from '../context/HealthCheckContext';
import { getDailyProgress, getWeeklyProgress } from '../services/progressApi';
import { getLocalDateKey } from '../utils/date';
import ProgressRing from '../components/common/ProgressRing';
import WeeklyRhythmChart from '../components/common/WeeklyRhythmChart';
import AnimatedNumber from '../components/common/AnimatedNumber';

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function Progress() {
  const { profile } = useAuth();
  const { streakDays, activeDate } = useHealthCheck();

  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const todayKey = getLocalDateKey();
  const selectedDate = activeDate || todayKey;

  const loadProgress = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [dailyRes, weeklyRes] = await Promise.all([
        getDailyProgress(selectedDate),
        getWeeklyProgress(),
      ]);

      if (dailyRes?.data) {
        setDailyData(dailyRes.data);
      }
      if (weeklyRes?.data) {
        setWeeklyData(weeklyRes.data);
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
      setError(err.message || 'Unable to load progress data. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    let isCurrent = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [dailyRes, weeklyRes] = await Promise.all([
          getDailyProgress(selectedDate),
          getWeeklyProgress(),
        ]);
        if (!isCurrent) return;

        if (dailyRes?.data) setDailyData(dailyRes.data);
        if (weeklyRes?.data) setWeeklyData(weeklyRes.data);
      } catch (err) {
        if (!isCurrent) return;
        console.error('Failed to load progress data:', err);
        setError(err.message || 'Unable to load progress data.');
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isCurrent = false;
    };
  }, [selectedDate]);

  // Derived metrics
  const completedToday = dailyData?.completed ?? 0;
  const totalToday = dailyData?.total ?? 24;
  const percentageToday = dailyData?.percentage ?? 0;
  const pendingToday = dailyData?.pending ?? Math.max(0, totalToday - completedToday);

  const weeklyDays = weeklyData?.days || [];
  const weeklyAverage = weeklyData?.averagePercentage ?? 0;
  const totalWeeklyCompleted = weeklyDays.reduce((acc, d) => acc + (d.completed || 0), 0);
  const hasWeeklyProgress = totalWeeklyCompleted > 0;
  const hasDailyProgress = completedToday > 0;

  // Find day with highest completion
  const bestDay = weeklyDays.length > 0
    ? [...weeklyDays].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0]
    : null;

  const getStatusBadge = (pct) => {
    if (pct === 100) {
      return { text: 'All Completed 🎉', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (pct >= 50) {
      return { text: 'Great Momentum', bg: 'bg-[var(--hc-primary-soft)] text-[var(--hc-primary)] border-[var(--hc-border)]' };
    }
    if (pct > 0) {
      return { text: 'In Progress', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { text: 'Not Started', bg: 'bg-slate-50 text-slate-600 border-slate-200' };
  };

  const todayStatus = getStatusBadge(percentageToday);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xs font-bold text-[var(--hc-primary)] hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-12 text-center shadow-xs">
          <div className="w-10 h-10 border-3 border-[var(--hc-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-manrope text-lg font-bold text-[var(--hc-ink)]">Loading your progress…</h2>
          <p className="text-xs text-[var(--hc-muted)] mt-1">Retrieving verified completion metrics from your account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/" className="text-xs font-bold text-[var(--hc-primary)] hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-slate-300">›</span>
            <span className="text-xs font-bold text-[var(--hc-muted)]">Progress & Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--hc-ink)] tracking-tight font-manrope">
            Progress & Analytics
          </h1>
          <p className="text-sm text-[var(--hc-muted)] mt-1">
            Real-time consistency metrics for {profile?.displayName || 'your account'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[var(--hc-border)] text-xs font-semibold text-[var(--hc-ink)] shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[var(--hc-primary)]" />
            <span>{formatDisplayDate(selectedDate)}</span>
          </div>

          <button
            type="button"
            onClick={() => loadProgress(true)}
            disabled={refreshing}
            className="ui-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[var(--hc-border)] text-xs font-semibold text-[var(--hc-ink)] hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--hc-primary)] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Updating…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold">Could not refresh analytics</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadProgress(true)}
            className="text-xs font-bold text-rose-800 underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Top Metrics Row: Today's Summary Hero & Key Pods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Daily Progress Hero Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[var(--hc-border)] p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--hc-primary)]">
                DAILY PROTOCOL COMPLETION
              </span>
              <h2 className="text-2xl font-bold text-[var(--hc-ink)] tracking-tight font-manrope">
                Today's Overview
              </h2>
              <p className="text-sm text-[var(--hc-muted)] leading-relaxed max-w-sm">
                {hasDailyProgress
                  ? `You have completed ${completedToday} of your ${totalToday} daily habits today. Keep the momentum going!`
                  : `No habits completed yet for today. Start with a glass of water or gentle movement.`}
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${todayStatus.bg}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {todayStatus.text}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--hc-surface-muted)] text-[var(--hc-muted)] text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {pendingToday} items remaining
                </span>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="flex flex-col items-center">
              <ProgressRing percentage={percentageToday} size={140} strokeWidth={13} />
              <span className="text-xs font-bold text-[var(--hc-ink)] mt-2">
                <AnimatedNumber value={completedToday} /> / {totalToday} completed
              </span>
            </div>
          </div>

          {/* Quick Metrics Tier */}
          <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-[var(--hc-border)]/70 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--hc-muted)]">
                ACTIVE STREAK
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-[var(--hc-ink)]">
                  <AnimatedNumber value={streakDays} /> Days
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--hc-muted)]">
                COMPLETION RATIO
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <TrendingUp className="w-4 h-4 text-[var(--hc-primary)] stroke-[2]" />
                <span className="text-sm font-bold text-[var(--hc-ink)]">
                  <AnimatedNumber value={percentageToday} suffix="%" />
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--hc-muted)]">
                REMAINING
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--hc-muted)] stroke-[2]" />
                <span className="text-sm font-bold text-[var(--hc-ink)]">
                  <AnimatedNumber value={pendingToday} /> Items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Performance Pods (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--hc-ink)] font-manrope">
                  7-Day Average
                </h3>
                <p className="text-xs text-[var(--hc-muted)]">Consistency across current week</p>
              </div>
              <span className="text-xl font-extrabold text-[var(--hc-primary)] font-manrope">
                <AnimatedNumber value={weeklyAverage} suffix="%" />
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--hc-border)]/70 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[var(--hc-muted)]">Total Habits Logged</span>
                <span className="font-bold text-[var(--hc-ink)]">{totalWeeklyCompleted} items</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[var(--hc-muted)]">Active Days</span>
                <span className="font-bold text-[var(--hc-ink)]">
                  {weeklyDays.filter((d) => (d.completed || 0) > 0).length} of 7 days
                </span>
              </div>
              {bestDay && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--hc-muted)]">Peak Consistency</span>
                  <span className="font-bold text-[var(--hc-primary)]">
                    {bestDay.day} ({bestDay.percentage}%)
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                to="/checklist"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--hc-primary-soft)] text-[var(--hc-primary)] font-semibold text-xs hover:bg-[var(--hc-primary)] hover:text-white transition-all"
              >
                <span>Open Daily Checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Rhythm Section */}
      <section className="bg-white rounded-2xl border border-[var(--hc-border)] p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--hc-primary)]" />
              <h2 className="text-lg font-bold text-[var(--hc-ink)] font-manrope">
                Weekly Rhythm Trajectory
              </h2>
            </div>
            <p className="text-xs text-[var(--hc-muted)] mt-0.5">
              Daily completion percentages from {formatDisplayDate(weeklyData?.startDate)} to {formatDisplayDate(weeklyData?.endDate)}
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--hc-primary-soft)] text-[var(--hc-primary)] self-start sm:self-auto">
            Weekly Avg: {weeklyAverage}%
          </span>
        </div>

        {/* Weekly Spline Chart */}
        {hasWeeklyProgress ? (
          <div className="pt-2">
            <WeeklyRhythmChart rhythmData={weeklyDays} />
          </div>
        ) : (
          /* Empty State when no completions logged in weekly range */
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-[var(--hc-border)] bg-[var(--hc-bg)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--hc-primary-soft)] text-[var(--hc-primary)] flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-[var(--hc-ink)] font-manrope">
              No Habit Progress Logged Yet
            </h3>
            <p className="text-xs text-[var(--hc-muted)] max-w-md mx-auto mt-1 leading-relaxed">
              You haven’t checked off any habits for this 7-day window. Complete your daily routines in the Daily Checklist to watch your weekly rhythm develop.
            </p>
            <div className="mt-4">
              <Link
                to="/checklist"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--hc-primary)] text-white text-xs font-semibold hover:bg-[var(--hc-primary-hover)] transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Daily Checklist</span>
              </Link>
            </div>
          </div>
        )}

        {/* 7-Day Day-by-Day Grid */}
        {weeklyDays.length > 0 && (
          <div className="pt-4 border-t border-[var(--hc-border)]/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--hc-muted)] mb-3">
              Daily Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {weeklyDays.map((d) => {
                const isSelected = d.date === selectedDate;
                const isComplete = d.percentage === 100;
                return (
                  <div
                    key={d.date}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-[var(--hc-primary)] bg-[var(--hc-primary-soft)]/40 ring-1 ring-[var(--hc-primary)]/20'
                        : 'border-[var(--hc-border)] bg-[var(--hc-bg)] hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-[var(--hc-muted)] block uppercase">
                      {d.day}
                    </span>
                    <span className="text-xs font-medium text-[var(--hc-ink)] block mt-0.5">
                      {d.date.slice(5)}
                    </span>

                    <div className="my-2">
                      <span className={`text-base font-extrabold font-manrope ${
                        d.percentage > 0 ? 'text-[var(--hc-primary)]' : 'text-slate-400'
                      }`}>
                        {d.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-[var(--hc-primary)]'}`}
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-[var(--hc-muted)] block mt-1.5 font-medium">
                      {d.completed} / {d.total} done
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Wellness Insight Footnote */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--hc-primary-soft)]/60 border border-[var(--hc-border)] flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[var(--hc-primary)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--hc-ink)] leading-relaxed">
          <p className="font-semibold">Consistency over perfection</p>
          <p className="text-[var(--hc-muted)] mt-0.5">
            Health habits are built through steady, repeatable actions rather than all-or-nothing streaks. Small steps completed daily yield long-term circadian balance and physical vitality.
          </p>
        </div>
      </div>
    </div>
  );
}

