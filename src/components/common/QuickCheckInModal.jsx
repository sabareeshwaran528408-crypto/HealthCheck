import React, { useState } from 'react';
import { X, Check, Droplet, Moon, Activity, Smile, Plus } from 'lucide-react';
import { useHealthCheck } from '../../context/HealthCheckContext';

export default function QuickCheckInModal() {
  const { isQuickCheckInOpen, setIsQuickCheckInOpen, showToast } = useHealthCheck();
  const [selectedMood, setSelectedMood] = useState('Energized');
  const [waterCups, setWaterCups] = useState(5);
  const [sleepHours, setSleepHours] = useState('8.2');

  if (!isQuickCheckInOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Quick Check-In recorded! Mood: ${selectedMood}, Water: ${waterCups} cups`);
    setIsQuickCheckInOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[var(--hc-border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--hc-border)] bg-[var(--hc-bg)]">
          <div>
            <h3 className="text-lg font-bold text-[var(--hc-ink)] font-manrope">Quick Check-In</h3>
            <p className="text-xs text-[var(--hc-muted)]">Log daily vitals and state in seconds</p>
          </div>
          <button
            onClick={() => setIsQuickCheckInOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mood selection */}
          <div>
            <label className="block text-xs font-bold text-[var(--hc-ink)] mb-2 uppercase tracking-wide">
              How do you feel right now?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Calm', 'Energized', 'Focused'].map((mood) => (
                <button
                  type="button"
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    selectedMood === mood
                      ? 'bg-[var(--hc-primary-soft)] border-[var(--hc-accent)] text-[var(--hc-primary)] ring-1 ring-[var(--hc-accent)]'
                      : 'border-[var(--hc-border)] text-[var(--hc-muted)] hover:bg-slate-50'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Hydration quick log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[var(--hc-ink)] uppercase tracking-wide flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-sky-500" />
                Water Logged
              </label>
              <span className="text-xs font-semibold text-[var(--hc-primary)]">{waterCups} / 8 cups</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((cup) => (
                <button
                  type="button"
                  key={cup}
                  onClick={() => setWaterCups(cup)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    cup <= waterCups
                      ? 'bg-[var(--hc-primary)] text-white'
                      : 'bg-[var(--hc-surface-muted)] text-[var(--hc-muted)] hover:bg-slate-200'
                  }`}
                >
                  {cup}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep hours */}
          <div>
            <label className="block text-xs font-bold text-[var(--hc-ink)] mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-teal-600" />
              Last Night's Sleep (Hours)
            </label>
            <input
              type="number"
              step="0.1"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[var(--hc-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hc-primary)]/20 focus:border-[var(--hc-primary)]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsQuickCheckInOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-[var(--hc-muted)] hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-[var(--hc-primary)] text-white hover:bg-[var(--hc-primary-hover)] shadow-sm transition-all"
            >
              Save Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
