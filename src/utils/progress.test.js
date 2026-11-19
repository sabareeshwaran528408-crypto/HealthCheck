import test from 'node:test';
import assert from 'node:assert/strict';

function getStatusBadge(pct) {
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
}

function calculateProgressMetrics(dailyData, weeklyData) {
  const completedToday = dailyData?.completed ?? 0;
  const totalToday = dailyData?.total ?? 24;
  const percentageToday = dailyData?.percentage ?? 0;
  const pendingToday = dailyData?.pending ?? Math.max(0, totalToday - completedToday);

  const weeklyDays = weeklyData?.days || [];
  const weeklyAverage = weeklyData?.averagePercentage ?? 0;
  const totalWeeklyCompleted = weeklyDays.reduce((acc, d) => acc + (d.completed || 0), 0);
  const hasWeeklyProgress = totalWeeklyCompleted > 0;
  const hasDailyProgress = completedToday > 0;

  const bestDay = weeklyDays.length > 0
    ? [...weeklyDays].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0]
    : null;

  return {
    completedToday,
    totalToday,
    percentageToday,
    pendingToday,
    weeklyDays,
    weeklyAverage,
    totalWeeklyCompleted,
    hasWeeklyProgress,
    hasDailyProgress,
    bestDay,
  };
}

test('Progress calculation handles empty state correctly', () => {
  const dailyEmpty = { completed: 0, total: 24, pending: 24, percentage: 0 };
  const weeklyEmpty = {
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    days: [
      { date: '2026-11-09', day: 'Mon', completed: 0, total: 24, percentage: 0 },
      { date: '2026-11-10', day: 'Tue', completed: 0, total: 24, percentage: 0 },
      { date: '2026-11-11', day: 'Wed', completed: 0, total: 24, percentage: 0 },
      { date: '2026-11-12', day: 'Thu', completed: 0, total: 24, percentage: 0 },
      { date: '2026-11-13', day: 'Fri', completed: 0, total: 24, percentage: 0 },
      { date: '2026-11-14', day: 'Sat', completed: 0, total: 24, percentage: 0 },
      { date: '2026-11-15', day: 'Sun', completed: 0, total: 24, percentage: 0 },
    ],
    averagePercentage: 0,
    totalActiveItems: 24,
  };

  const metrics = calculateProgressMetrics(dailyEmpty, weeklyEmpty);

  assert.equal(metrics.hasDailyProgress, false);
  assert.equal(metrics.hasWeeklyProgress, false);
  assert.equal(metrics.completedToday, 0);
  assert.equal(metrics.pendingToday, 24);
  assert.equal(metrics.weeklyAverage, 0);
  assert.equal(metrics.totalWeeklyCompleted, 0);
  assert.equal(getStatusBadge(metrics.percentageToday).text, 'Not Started');
});

test('Progress calculation correctly computes active progress and best day', () => {
  const dailyActive = { completed: 18, total: 24, pending: 6, percentage: 75 };
  const weeklyActive = {
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    days: [
      { date: '2026-11-09', day: 'Mon', completed: 12, total: 24, percentage: 50 },
      { date: '2026-11-10', day: 'Tue', completed: 24, total: 24, percentage: 100 },
      { date: '2026-11-11', day: 'Wed', completed: 18, total: 24, percentage: 75 },
      { date: '2026-11-12', day: 'Thu', completed: 6, total: 24, percentage: 25 },
      { date: '2026-11-13', day: 'Fri', completed: 12, total: 24, percentage: 50 },
      { date: '2026-11-14', day: 'Sat', completed: 0, total: 24, percentage: 0 },
      { date: '2026-11-15', day: 'Sun', completed: 18, total: 24, percentage: 75 },
    ],
    averagePercentage: 54,
    totalActiveItems: 24,
  };

  const metrics = calculateProgressMetrics(dailyActive, weeklyActive);

  assert.equal(metrics.hasDailyProgress, true);
  assert.equal(metrics.hasWeeklyProgress, true);
  assert.equal(metrics.completedToday, 18);
  assert.equal(metrics.pendingToday, 6);
  assert.equal(metrics.percentageToday, 75);
  assert.equal(metrics.totalWeeklyCompleted, 90);
  assert.equal(metrics.bestDay.day, 'Tue');
  assert.equal(metrics.bestDay.percentage, 100);
  assert.equal(getStatusBadge(metrics.percentageToday).text, 'Great Momentum');
  assert.equal(getStatusBadge(100).text, 'All Completed 🎉');
});

