import { useMemo, useState } from 'react';
import {
  Activity,
  Apple,
  Bookmark,
  Check,
  Clock3,
  Droplet,
  Heart,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Wind,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHealthCheck } from '../context/HealthCheckContext';

const categories = [
  'All',
  'Sleep',
  'Physical activity',
  'Nutrition',
  'Hydration',
  'Mental wellbeing',
  'Study habits',
  'Skin care',
  'Hair care',
];

const categoryIcons = {
  Sleep: Moon,
  'Physical activity': Activity,
  Nutrition: Apple,
  Hydration: Droplet,
  'Mental wellbeing': Wind,
  'Study habits': Clock3,
  'Skin care': Sun,
  'Hair care': Heart,
};

const categoryColors = {
  Sleep: 'bg-amber-50 text-amber-600',
  'Physical activity': 'bg-teal-50 text-teal-700',
  Nutrition: 'bg-rose-50 text-rose-600',
  Hydration: 'bg-sky-50 text-sky-600',
  'Mental wellbeing': 'bg-emerald-50 text-emerald-700',
  'Study habits': 'bg-indigo-50 text-indigo-600',
  'Skin care': 'bg-orange-50 text-orange-600',
  'Hair care': 'bg-purple-50 text-purple-600',
};

function RecommendationCard({ recommendation, onSave, onAdd }) {
  const Icon = categoryIcons[recommendation.category] || Sparkles;

  return (
    <article className="recommendation-card ui-card group flex flex-col justify-between rounded-2xl border border-[var(--hc-border)] bg-white p-5 shadow-xs transition-all hover:border-[#B8DCD7] hover:shadow-md">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${categoryColors[recommendation.category] || 'bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]'}`}>
            <Icon className="h-5 w-5" />
          </span>
          <span className={`rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-bold ${categoryColors[recommendation.category] || 'bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]'}`}>
            {recommendation.category}
          </span>
        </div>
        <h2 className="font-manrope text-base font-bold leading-snug text-[var(--hc-ink)] transition-colors group-hover:text-[var(--hc-primary)]">
          {recommendation.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--hc-muted)]">{recommendation.description}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-[var(--hc-border)]/70 pt-4">
        <span className="text-xs font-semibold text-[var(--hc-muted)]">{recommendation.frequency}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSave(recommendation.id)}
            aria-label={`${recommendation.saved ? 'Remove saved' : 'Save'} ${recommendation.title}`}
            className={`ui-button inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
              recommendation.saved ? 'bg-[var(--hc-primary-soft)] text-[var(--hc-primary)]' : 'text-[var(--hc-muted)] hover:bg-slate-50 hover:text-[var(--hc-ink)]'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${recommendation.saved ? 'fill-[var(--hc-primary)]' : ''}`} />
            <span>{recommendation.saved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={() => onAdd(recommendation)}
            aria-label={`Add ${recommendation.title} to checklist`}
            className="ui-button inline-flex items-center gap-1 rounded-lg bg-[var(--hc-primary)] px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--hc-primary-hover)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Recommendations() {
  const { recommendations, toggleSaveRecommendation, addRecommendationToRoutine } = useHealthCheck();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecommendations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return recommendations.filter((recommendation) => {
      const matchesCategory = activeCategory === 'All' || recommendation.category === activeCategory;
      const matchesSearch = !query
        || recommendation.title.toLowerCase().includes(query)
        || recommendation.description.toLowerCase().includes(query)
        || recommendation.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, recommendations, searchTerm]);

  const addToChecklist = (recommendation) => {
    const targetCategory = recommendation.category === 'Sleep' ? 'Night & Sleep Hygiene' : 'Daytime Energy';
    addRecommendationToRoutine(recommendation.title, targetCategory, recommendation.category);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-16 sm:space-y-8">
      <div className="space-y-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hc-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--hc-primary)] transition-colors hover:bg-[#DAE2FD]">
          <Sparkles className="h-3.5 w-3.5" />
          Everyday ideas for your routine
        </Link>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-manrope text-3xl font-extrabold tracking-tight text-[var(--hc-ink)] sm:text-4xl">Wellness Recommendations</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--hc-muted)]">
              Simple, flexible suggestions to support your everyday wellbeing. Choose what feels useful for you.
            </p>
          </div>
          <label className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hc-muted)]" />
            <input
              type="search"
              placeholder="Search topics or suggestions..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-[var(--hc-border)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--hc-ink)] shadow-2xs outline-none transition-all placeholder:text-[var(--hc-muted)] focus:border-[var(--hc-primary)] focus:ring-2 focus:ring-[var(--hc-primary)]/20"
            />
          </label>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hc-primary)] to-[var(--hc-primary-hover)] p-6 text-white shadow-sm sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            A little inspiration
          </span>
          <h2 className="mt-4 font-manrope text-2xl font-extrabold sm:text-3xl">Wellbeing is built one small choice at a time.</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
            Browse approachable ideas for rest, movement, meals, hydration, focus, and personal care. Adapt them to your needs and routine.
          </p>
        </div>
        <Sparkles className="absolute -right-4 -top-8 h-48 w-48 text-white/10" aria-hidden="true" />
      </section>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--hc-primary)]" />
          <h2 className="font-manrope text-base font-bold text-[var(--hc-ink)]">Explore by category</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`ui-button whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                activeCategory === category
                  ? 'bg-[var(--hc-primary)] text-white shadow-xs'
                  : 'border border-[var(--hc-border)] bg-white text-[var(--hc-muted)] hover:bg-slate-50 hover:text-[var(--hc-ink)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredRecommendations.length > 0 ? (
        <div key={activeCategory} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onSave={toggleSaveRecommendation}
              onAdd={addToChecklist}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--hc-border)] bg-white px-5 py-12 text-center">
          <Search className="mx-auto h-6 w-6 text-[var(--hc-muted)]" />
          <p className="mt-3 font-manrope text-sm font-bold text-[var(--hc-ink)]">No suggestions found</p>
          <p className="mt-1 text-xs text-[var(--hc-muted)]">Try another search or category.</p>
        </div>
      )}

      <aside className="rounded-2xl border border-[var(--hc-border)] bg-[var(--hc-primary-soft)] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--hc-primary)]">
            <Check className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-manrope text-sm font-bold text-[var(--hc-ink)]">A note about these suggestions</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--hc-muted)]">
              These are general wellness ideas, not medical advice or a diagnosis. Everyone’s needs are different; adapt or skip any suggestion that does not suit you.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
