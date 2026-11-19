import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { useHealthCheck } from '../../context/HealthCheckContext';

export default function AddHabitModal() {
  const { isAddHabitOpen, setIsAddHabitOpen, addCustomHabit } = useHealthCheck();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Morning Routine');
  const [tag, setTag] = useState('Wellness');

  if (!isAddHabitOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCustomHabit({ title, subtitle, category, tag });
    setTitle('');
    setSubtitle('');
    setIsAddHabitOpen(false);
  };

  const categories = [
    'Morning Routine',
    'Daytime Energy',
    'Evening Wind-Down',
    'Mental Wellbeing',
    'Night & Sleep Hygiene'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[var(--hc-border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--hc-border)] bg-[var(--hc-bg)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--hc-primary-soft)] flex items-center justify-center text-[var(--hc-primary)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--hc-ink)] font-manrope">Add Custom Habit</h3>
              <p className="text-xs text-[var(--hc-muted)]">Create a tailored action for your routine</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddHabitOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--hc-ink)] mb-1.5 uppercase tracking-wide">
              Habit Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 10-minute mindful breathing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[var(--hc-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hc-primary)]/20 focus:border-[var(--hc-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--hc-ink)] mb-1.5 uppercase tracking-wide">
              Target / Details
            </label>
            <input
              type="text"
              placeholder="e.g. Inhale 4s, hold 4s, exhale 4s"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[var(--hc-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hc-primary)]/20 focus:border-[var(--hc-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--hc-ink)] mb-1.5 uppercase tracking-wide">
                Routine Segment
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[var(--hc-border)] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[var(--hc-primary)]/20 focus:border-[var(--hc-primary)]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--hc-ink)] mb-1.5 uppercase tracking-wide">
                Category Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Mindfulness"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[var(--hc-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hc-primary)]/20 focus:border-[var(--hc-primary)]"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddHabitOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-[var(--hc-muted)] hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-[var(--hc-primary)] text-white hover:bg-[var(--hc-primary-hover)] shadow-sm transition-all"
            >
              Add Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
