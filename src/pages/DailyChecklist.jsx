import { useState } from 'react';
import {
  Activity,
  Apple,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Coffee,
  Droplet,
  Moon,
  Plus,
  Sun,
  Sunset,
  Utensils,
  Brain,
  Heart,
  Sparkles,
} from 'lucide-react';
import { getLocalDateKey } from '../utils/date';
import { useHealthCheck } from '../context/HealthCheckContext';

const categories = [
  { name: 'Morning Routine', label: 'MORNING', icon: Sun, iconBg: 'bg-[#FEF3C7] text-[#D97706]' },
  { name: 'Daytime Energy', label: 'DAYTIME', icon: Activity, iconBg: 'bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]' },
  { name: 'Mental Wellbeing', label: 'STUDY & MENTAL WELLBEING', icon: Brain, iconBg: 'bg-[var(--hc-primary-soft)] text-[#4F46E5]' },
  { name: 'Evening Wind-Down', label: 'EVENING', icon: Sunset, iconBg: 'bg-[#EDE9FE] text-[#7C3AED]' },
  { name: 'Night & Sleep Hygiene', label: 'NIGHT', icon: Moon, iconBg: 'bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]' },
];

const itemIcons = {
  alarm: Sun,
  droplet: Droplet,
  sparkles: Sparkles,
  activity: Activity,
  heart: Heart,
  utensils: Utensils,
  apple: Apple,
  sun: Sun,
  brain: Brain,
  coffee: Coffee,
  smartphone: Moon,
  wind: Sparkles,
  moon: Moon,
  calendar: Calendar,
};

function formatSelectedDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function shiftDate(date, amount) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + amount);
  return [
    nextDate.getFullYear(),
    String(nextDate.getMonth() + 1).padStart(2, '0'),
    String(nextDate.getDate()).padStart(2, '0'),
  ].join('-');
}

function CategoryCard({ category, habits, onToggle, collapsed, onCollapse }) {
  const items = habits.filter((habit) => habit.category === category.name);
  const completed = items.filter((habit) => habit.completed).length;
  const percentage = items.length ? Math.round((completed / items.length) * 100) : 0;
  const CategoryIcon = category.icon;

  return (
    <section className="ui-card overflow-hidden rounded-2xl border border-[var(--hc-border)] bg-white shadow-xs">
      <button
        type="button"
        onClick={onCollapse}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between gap-4 border-b border-[var(--hc-border)]/60 p-5 text-left transition-colors hover:bg-slate-50/50"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${category.iconBg}`}>
            <CategoryIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-extrabold tracking-wider text-[var(--hc-primary)]">{category.label}</span>
            <span className="mt-1 block text-xs text-[var(--hc-muted)]">{completed} of {items.length} completed</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="rounded-full bg-[var(--hc-primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--hc-primary)]">{percentage}%</span>
          {collapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
        </span>
      </button>

      {!collapsed && (
        <ul className="category-content-enter space-y-2 p-4">
          {items.map((habit) => {
            const ItemIcon = itemIcons[habit.icon] || Sparkles;
            return (
              <li key={habit.id} className="checklist-item">
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all ${
                  habit.completed
                    ? 'border-[var(--hc-border)] bg-[var(--hc-primary-soft)]/70'
                    : 'border-[var(--hc-border)] bg-white hover:border-[#99D9D1]'
                }`}>
                  <input
                    type="checkbox"
                    checked={habit.completed}
                    onChange={() => onToggle(habit.id)}
                    className="peer sr-only"
                  />
                  <span className={`checklist-item__check flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    habit.completed ? 'is-checked bg-[var(--hc-primary)] text-white shadow-xs' : 'border-2 border-[var(--hc-border)] bg-white'
                  }`}>
                    {habit.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold transition-colors ${
                      habit.completed ? 'text-[var(--hc-muted)] line-through' : 'text-[var(--hc-ink)]'
                    }`}>{habit.title}</span>
                    <span className="mt-0.5 block text-xs text-[var(--hc-muted)]">{habit.subtitle}</span>
                  </span>
                  <ItemIcon className={`h-4 w-4 shrink-0 ${habit.completed ? 'text-[var(--hc-primary)]' : 'text-slate-400'}`} />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function DailyChecklist() {
  const { habits, toggleHabit, stats, activeDate, setActiveDate, setIsAddHabitOpen, isLoading, dataSource } = useHealthCheck();
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const today = getLocalDateKey();
  const toggleCategory = (name) => {
    setCollapsedCategories((current) => ({ ...current, [name]: !current[name] }));
  };

  return (
    <div className="animate-fade-in space-y-6 pb-16 sm:space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--hc-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--hc-primary)]">DAILY PROTOCOL</span>
            {dataSource === 'api' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live MySQL
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Offline Mode
              </span>
            )}
            <span className="text-xs font-medium text-[var(--hc-muted)]">A gentle routine, one step at a time</span>
          </div>
          <h1 className="font-manrope text-3xl font-extrabold tracking-tight text-[var(--hc-ink)] sm:text-4xl">Daily Checklist</h1>
          <p className="mt-1 text-sm text-[var(--hc-muted)]">Small steps make a big difference. Build sustainable wellness habits.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--hc-border)] bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveDate(shiftDate(activeDate, -1))}
              aria-label="Previous day"
              className="ui-button rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[var(--hc-primary)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <label className="relative flex min-w-0 cursor-pointer items-center gap-2 px-1 text-xs font-bold text-[var(--hc-ink)]">
              <Calendar className="h-4 w-4 shrink-0 text-[var(--hc-primary)]" />
              <span className="hidden sm:inline">{formatSelectedDate(activeDate)}</span>
              <span className="sm:hidden">{new Date(`${activeDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <input
                aria-label="Select checklist date"
                type="date"
                required
                value={activeDate}
                onChange={(event) => {
                  if (event.target.value) setActiveDate(event.target.value);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <button
              type="button"
              onClick={() => setActiveDate(shiftDate(activeDate, 1))}
              aria-label="Next day"
              className="ui-button rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[var(--hc-primary)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveDate(today)}
              className="ui-button rounded-lg bg-[var(--hc-primary-soft)] px-2.5 py-1.5 text-xs font-bold text-[var(--hc-primary)] transition-colors hover:bg-[var(--hc-primary-soft)]"
            >
              Today
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsAddHabitOpen(true)}
            className="ui-button inline-flex items-center gap-2 rounded-xl bg-[var(--hc-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[var(--hc-primary)]/20 transition-all hover:bg-[var(--hc-primary-hover)]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Custom Habit</span>
          </button>
        </div>
      </div>

      <section className="ui-card space-y-5 rounded-2xl border border-[var(--hc-border)] bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]">
              <Check className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-manrope text-base font-bold text-[var(--hc-ink)] sm:text-lg">{stats.completed} / {stats.total} completed</span>
                <span className="rounded-full bg-[var(--hc-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--hc-primary)]">{stats.percentage}%</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--hc-muted)]">{formatSelectedDate(activeDate)}</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-[var(--hc-muted)]">{stats.pending} items left for today</p>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--hc-surface-muted)]"
          role="progressbar"
          aria-label="Daily checklist progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={stats.percentage}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--hc-primary)] to-[var(--hc-accent)] transition-all duration-500" style={{ width: `${stats.percentage}%` }} />
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {categories.map((category) => (
            <div key={category.name}>
              <CategoryCard
                category={category}
                habits={habits}
                onToggle={toggleHabit}
                collapsed={Boolean(collapsedCategories[category.name])}
                onCollapse={() => toggleCategory(category.name)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
