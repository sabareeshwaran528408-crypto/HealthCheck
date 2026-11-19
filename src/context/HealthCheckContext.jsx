import React,
  {
    createContext,
    useContext,
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
  } from 'react';
import { getLocalDateKey } from '../utils/date';
import { getDailyChecklist, updateChecklistItem } from '../services/checklistApi';
import { getWeeklyProgress } from '../services/progressApi';
import { getRecommendations as fetchRecommendationsApi } from '../services/recommendationApi';
import { getReminders, createReminder, updateReminder as apiUpdateReminder, deleteReminder as apiDeleteReminder } from '../services/reminderApi';
import { getNotificationPreferences, updateNotificationPreferences as apiUpdatePreferences } from '../services/notificationApi';
import { getNextUpcomingReminder } from '../utils/reminders';
import { useAuth } from '../auth/useAuth';

const BACKEND_TO_UI_CATEGORY = {
  Morning: 'Morning Routine',
  Daytime: 'Daytime Energy',
  'Study & Mental': 'Mental Wellbeing',
  Evening: 'Evening Wind-Down',
  Night: 'Night & Sleep Hygiene',
};

const BACKEND_TO_REC_CATEGORY = {
  Exercise: 'Physical activity',
  'Mental Wellbeing': 'Mental wellbeing',
  'Study & Focus': 'Study habits',
  'Healthy Skin': 'Skin care',
  'Hair & Scalp Care': 'Hair care',
  Sleep: 'Sleep',
  Nutrition: 'Nutrition',
  Hydration: 'Hydration',
};

const REC_PILL_COLORS = {
  Sleep: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Physical activity': 'bg-teal-50 text-teal-700 border-teal-200',
  Nutrition: 'bg-amber-50 text-amber-700 border-amber-200',
  Hydration: 'bg-sky-50 text-sky-700 border-sky-200',
  'Mental wellbeing': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Study habits': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Skin care': 'bg-teal-50 text-teal-700 border-teal-200',
  'Hair care': 'bg-purple-50 text-purple-700 border-purple-200',
};

const REC_ICONS = {
  Sleep: 'moon',
  'Physical activity': 'activity',
  Nutrition: 'apple',
  Hydration: 'droplet',
  'Mental wellbeing': 'wind',
  'Study habits': 'clock',
  'Skin care': 'sun',
  'Hair care': 'heart',
};

function resolveHabitIcon(title) {
  const t = title.toLowerCase();
  if (t.includes('wake') || t.includes('planned time')) return 'alarm';
  if (t.includes('water') || t.includes('drink')) return 'droplet';
  if (t.includes('wash') || t.includes('brush') || t.includes('skincare')) return 'sparkles';
  if (t.includes('exercise') || t.includes('movement') || t.includes('walk') || t.includes('activity')) return 'activity';
  if (t.includes('bath') || t.includes('heart')) return 'heart';
  if (t.includes('breakfast') || t.includes('lunch') || t.includes('dinner') || t.includes('protein')) return 'utensils';
  if (t.includes('vegetable') || t.includes('fruit') || t.includes('snack')) return 'apple';
  if (t.includes('daylight') || t.includes('sun')) return 'sun';
  if (t.includes('study') || t.includes('session')) return 'brain';
  if (t.includes('break')) return 'coffee';
  if (t.includes('phone')) return 'smartphone';
  if (t.includes('relax')) return 'wind';
  if (t.includes('screen') || t.includes('sleep')) return 'moon';
  if (t.includes('prepare') || t.includes('tomorrow')) return 'calendar';
  return 'sparkles';
}

function adaptChecklistItem(item) {
  const uiCategory = BACKEND_TO_UI_CATEGORY[item.category] || item.category;
  return {
    id: item.id,
    title: item.title,
    subtitle: item.description || '',
    description: item.description || '',
    category: uiCategory,
    category_name: item.category,
    category_id: item.category_id,
    tag: item.category,
    completed: Boolean(item.completed),
    completed_at: item.completed_at,
    pinned: item.display_order <= 2 && (item.category === 'Morning' || item.category === 'Daytime'),
    icon: resolveHabitIcon(item.title),
    display_order: item.display_order,
  };
}

function adaptRecommendation(rec) {
  const uiCategory = BACKEND_TO_REC_CATEGORY[rec.category] || rec.category;
  return {
    id: rec.id,
    title: rec.title,
    category: uiCategory,
    pillColor: REC_PILL_COLORS[uiCategory] || 'bg-slate-50 text-slate-700 border-slate-200',
    description: rec.content,
    frequency: rec.display_order === 1 ? 'Daily' : 'Throughout the day',
    saved: false,
    icon: REC_ICONS[uiCategory] || 'sparkles',
  };
}

const initialHabits = [
  { id: 'm1', title: 'Wake up at the planned time', subtitle: 'Follow the wake-up time that works for you', category: 'Morning Routine', tag: 'Routine', completed: false, pinned: true, icon: 'alarm' },
  { id: 'm2', title: 'Drink water', subtitle: 'Start the day with a glass of water', category: 'Morning Routine', tag: 'Hydration', completed: false, pinned: true, icon: 'droplet' },
  { id: 'm3', title: 'Wash and freshen up', subtitle: 'A simple morning hygiene routine', category: 'Morning Routine', tag: 'Hygiene', completed: false, pinned: false, icon: 'sparkles' },
  { id: 'm4', title: '10–15 minutes of exercise', subtitle: 'Choose movement that feels comfortable', category: 'Morning Routine', tag: 'Movement', completed: false, pinned: true, icon: 'activity' },
  { id: 'm5', title: 'Bath and basic skincare', subtitle: 'Keep your routine gentle and simple', category: 'Morning Routine', tag: 'Self-care', completed: false, pinned: false, icon: 'heart' },
  { id: 'm6', title: 'Eat a balanced breakfast', subtitle: 'Include foods that help you feel satisfied', category: 'Morning Routine', tag: 'Nutrition', completed: false, pinned: true, icon: 'utensils' },
  { id: 'd1', title: 'Drink water regularly', subtitle: 'Sip water throughout the day as you feel thirsty', category: 'Daytime Energy', tag: 'Hydration', completed: false, pinned: true, icon: 'droplet' },
  { id: 'd2', title: 'Eat lunch', subtitle: 'Take a pause for a nourishing midday meal', category: 'Daytime Energy', tag: 'Nutrition', completed: false, pinned: false, icon: 'utensils' },
  { id: 'd3', title: 'Include a protein source', subtitle: 'Choose a protein food that suits your preferences', category: 'Daytime Energy', tag: 'Nutrition', completed: false, pinned: false, icon: 'utensils' },
  { id: 'd4', title: 'Eat vegetables or fruit', subtitle: 'Add produce to a meal or snack', category: 'Daytime Energy', tag: 'Nutrition', completed: false, pinned: false, icon: 'apple' },
  { id: 'd5', title: 'Take movement breaks', subtitle: 'Stand, stretch, or walk between activities', category: 'Daytime Energy', tag: 'Movement', completed: false, pinned: false, icon: 'activity' },
  { id: 'd6', title: 'Get some daylight', subtitle: 'Spend a little time outdoors if convenient', category: 'Daytime Energy', tag: 'Daylight', completed: false, pinned: false, icon: 'sun' },
  { id: 'mw1', title: 'Complete a focused study session', subtitle: 'Set a manageable goal for your session', category: 'Mental Wellbeing', tag: 'Study', completed: false, pinned: false, icon: 'brain' },
  { id: 'mw2', title: 'Take short breaks', subtitle: 'Pause regularly during longer study sessions', category: 'Mental Wellbeing', tag: 'Rest', completed: false, pinned: false, icon: 'coffee' },
  { id: 'mw3', title: 'Limit unnecessary phone use', subtitle: 'Reduce distractions during focused time', category: 'Mental Wellbeing', tag: 'Focus', completed: false, pinned: false, icon: 'smartphone' },
  { id: 'mw4', title: 'Spend a few minutes relaxing', subtitle: 'Try a quiet pause, gentle breathing, or music', category: 'Mental Wellbeing', tag: 'Relaxation', completed: false, pinned: false, icon: 'wind' },
  { id: 'e1', title: '5–10 minutes of light walking or activity', subtitle: 'Choose an easy pace that feels comfortable', category: 'Evening Wind-Down', tag: 'Movement', completed: false, pinned: false, icon: 'activity' },
  { id: 'e2', title: 'Drink water', subtitle: 'Have water with or between activities', category: 'Evening Wind-Down', tag: 'Hydration', completed: false, pinned: false, icon: 'droplet' },
  { id: 'e3', title: 'Have a healthy snack if hungry', subtitle: 'Choose something satisfying if you want a snack', category: 'Evening Wind-Down', tag: 'Nutrition', completed: false, pinned: false, icon: 'apple' },
  { id: 'n1', title: 'Eat dinner', subtitle: 'Make time for an evening meal', category: 'Night & Sleep Hygiene', tag: 'Nutrition', completed: false, pinned: false, icon: 'utensils' },
  { id: 'n2', title: 'Brush teeth and wash face', subtitle: 'Wind down with your usual hygiene routine', category: 'Night & Sleep Hygiene', tag: 'Hygiene', completed: false, pinned: false, icon: 'sparkles' },
  { id: 'n3', title: 'Reduce screen use before bed', subtitle: 'Take a screen break as part of winding down', category: 'Night & Sleep Hygiene', tag: 'Sleep', completed: false, pinned: false, icon: 'moon' },
  { id: 'n4', title: 'Prepare for tomorrow', subtitle: 'Set out what you need for the next day', category: 'Night & Sleep Hygiene', tag: 'Planning', completed: false, pinned: false, icon: 'calendar' },
  { id: 'n5', title: 'Plan enough time for 8–10 hours of sleep', subtitle: 'Make a bedtime plan that fits your schedule', category: 'Night & Sleep Hygiene', tag: 'Rest', completed: false, pinned: false, icon: 'moon' },
];

const initialRecommendations = [
  { id: 'r1', title: 'Keep a steady sleep routine', category: 'Sleep', pillColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Try to keep a regular bedtime and wake time when your schedule allows. A calm, comfortable sleep environment can make winding down easier.', frequency: 'Daily', saved: false, icon: 'moon' },
  { id: 'r2', title: 'Add gentle movement breaks', category: 'Physical activity', pillColor: 'bg-teal-50 text-teal-700 border-teal-200', description: 'Break up long periods of sitting with a brief walk, stretch, or other movement that feels comfortable for you.', frequency: 'Throughout the day', saved: true, icon: 'activity' },
  { id: 'r3', title: 'Build balanced meals', category: 'Nutrition', pillColor: 'bg-amber-50 text-amber-700 border-amber-200', description: 'When available, include a mix of foods such as vegetables or fruit, grains, and a protein source. Aim for variety rather than perfection.', frequency: 'Mealtimes', saved: false, icon: 'apple' },
  { id: 'r4', title: 'Keep water within reach', category: 'Hydration', pillColor: 'bg-sky-50 text-sky-700 border-sky-200', description: 'Keep a glass or bottle nearby and drink regularly according to your thirst, activity, and environment.', frequency: 'Throughout the day', saved: false, icon: 'droplet' },
  { id: 'r5', title: 'Make space to unwind', category: 'Mental wellbeing', pillColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', description: 'Try a few minutes of a relaxing activity you enjoy, such as listening to music, stretching gently, or taking a quiet pause.', frequency: 'When useful', saved: false, icon: 'wind' },
  { id: 'r6', title: 'Use focused study intervals', category: 'Study habits', pillColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', description: 'Choose one small task, work on it without distractions for a manageable period, then take a short break before continuing.', frequency: 'Study sessions', saved: false, icon: 'clock' },
  { id: 'r7', title: 'Keep skincare simple and gentle', category: 'Skin care', pillColor: 'bg-teal-50 text-teal-700 border-teal-200', description: 'Use gentle cleansing and moisturizer that suit your skin. Consider sun protection as part of daytime care.', frequency: 'Daily', saved: false, icon: 'sun' },
  { id: 'r8', title: 'Treat hair gently', category: 'Hair care', pillColor: 'bg-purple-50 text-purple-700 border-purple-200', description: 'Use products and washing frequency that suit your hair, detangle gently, and avoid excessive heat where practical.', frequency: 'As needed', saved: false, icon: 'heart' },
];

function getOfflineStorageKey(userId, date) {
  return `healthcheck-offline-habits-${userId}-${date}`;
}

function loadOfflineHabitsForDate(userId, date) {
  const saved = localStorage.getItem(getOfflineStorageKey(userId, date));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn(`Could not parse offline habits for ${date}:`, e);
    }
  }
  return initialHabits.map((habit) => ({ ...habit, completed: false }));
}

function saveOfflineHabitsForDate(userId, date, data) {
  try {
    localStorage.setItem(getOfflineStorageKey(userId, date), JSON.stringify(data));
  } catch (e) {
    console.warn(`Could not save offline habits for ${date}:`, e);
  }
}

const HealthCheckContext = createContext();

export function HealthCheckProvider({ children }) {
  const { user } = useAuth();
  const userId = user.id;
  const [activeDate, setActiveDateState] = useState(getLocalDateKey);
  const [habits, setHabits] = useState([]);
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [streakDays] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('api'); // 'api' | 'offline'
  const [weeklyProgress, setWeeklyProgress] = useState(null);

  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState(null);

  const [preferences, setPreferences] = useState({
    browser_notifications: true,
    email_notifications: false,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesError, setPreferencesError] = useState(null);

  const [clockMinute, setClockMinute] = useState(() => Date.now());

  const isMounted = useRef(true);
  const inFlightUpdates = useRef(new Set());

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch checklist items whenever activeDate changes
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    async function fetchChecklist() {
      try {
        const response = await getDailyChecklist(activeDate);
        if (!isCurrent) return;

        if (response?.data && Array.isArray(response.data)) {
          const mapped = response.data.map(adaptChecklistItem);
          setHabits(mapped);
          setDataSource('api');
          setError(null);
        } else {
          throw new Error('Server returned an unexpected checklist data format.');
        }
      } catch (err) {
        if (!isCurrent) return;
        console.warn(`Checklist API request failed for ${activeDate}:`, err.message);
        setDataSource('offline');
        setError(`Operating in offline mode: ${err.message}`);
        // Fall back to local offline storage, never pretending it synchronized with MySQL
        setHabits(loadOfflineHabitsForDate(userId, activeDate));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    fetchChecklist();

    return () => {
      isCurrent = false;
    };
  }, [activeDate, userId]);

  // Fetch weekly progress on mount or activeDate changes
  useEffect(() => {
    let isCurrent = true;

    async function fetchWeekly() {
      try {
        const response = await getWeeklyProgress();
        if (!isCurrent) return;
        if (response?.data) {
          setWeeklyProgress(response.data);
        }
      } catch (err) {
        if (!isCurrent) return;
        console.warn('Weekly progress API request failed:', err.message);
      }
    }

    fetchWeekly();

    return () => {
      isCurrent = false;
    };
  }, [activeDate, userId]);

  // Fetch seeded recommendations from backend
  useEffect(() => {
    let isCurrent = true;

    async function fetchRecs() {
      try {
        const response = await fetchRecommendationsApi();
        if (!isCurrent) return;
        if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
          setRecommendations(response.data.map(adaptRecommendation));
        }
      } catch (err) {
        if (!isCurrent) return;
        console.warn('Recommendations API request failed, using defaults:', err.message);
      }
    }

    fetchRecs();

    return () => {
      isCurrent = false;
    };
  }, []);

  const setActiveDate = (date) => {
    setActiveDateState(date);
  };

  const toggleHabit = async (id) => {
    if (inFlightUpdates.current.has(id)) {
      // Prevent duplicate requests and race conditions
      return;
    }

    const targetHabit = habits.find((h) => h.id === id);
    if (!targetHabit) return;

    const nextCompleted = !targetHabit.completed;

    if (dataSource === 'offline') {
      const updated = habits.map((h) => (h.id === id ? { ...h, completed: nextCompleted } : h));
      setHabits(updated);
      saveOfflineHabitsForDate(userId, activeDate, updated);
      showToast(
        nextCompleted
          ? `(Offline) Completed: "${targetHabit.title}"`
          : `(Offline) Marked incomplete: "${targetHabit.title}"`
      );
      return;
    }

    inFlightUpdates.current.add(id);

    try {
      const response = await updateChecklistItem(id, nextCompleted, activeDate);

      if (response && response.success) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completed: nextCompleted,
                  completed_at: response.data?.completed_at || (nextCompleted ? new Date().toISOString() : null),
                }
              : h
          )
        );

        showToast(
          nextCompleted
            ? `Completed: "${targetHabit.title}"`
            : `Marked incomplete: "${targetHabit.title}"`
        );

        // Refresh weekly progress asynchronously
        getWeeklyProgress()
          .then((wpRes) => {
            if (wpRes?.data) setWeeklyProgress(wpRes.data);
          })
          .catch(() => {});
      } else {
        throw new Error(response?.message || 'Server did not confirm completion update.');
      }
    } catch (err) {
      console.error(`Checklist toggle error for item ${id}:`, err);
      showToast(`Could not update habit on server: ${err.message}`);
      // Do NOT toggle state locally when API request fails
    } finally {
      inFlightUpdates.current.delete(id);
    }
  };

  const addCustomHabit = (newHabit) => {
    const habit = {
      id: `custom_${Date.now()}`,
      title: newHabit.title || 'New Habit',
      subtitle: newHabit.subtitle || 'Personalized wellness action',
      description: newHabit.subtitle || 'Personalized wellness action',
      category: newHabit.category || 'Morning Routine',
      tag: newHabit.tag || 'Custom',
      completed: false,
      pinned: true,
      icon: 'sparkles',
    };
    setHabits((prev) => [habit, ...prev]);
    showToast(`Added custom habit: "${habit.title}"`);
  };

  const toggleSaveRecommendation = (id) => {
    setRecommendations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextSaved = !r.saved;
          showToast(
            nextSaved
              ? `Saved "${r.title}" to favorites`
              : `Removed "${r.title}" from favorites`
          );
          return { ...r, saved: nextSaved };
        }
        return r;
      })
    );
  };

  // ---------- Reminder loading & CRUD ----------
  // Load reminders for the authenticated user
  const loadReminders = useCallback(async () => {
    setRemindersLoading(true);
    setRemindersError(null);
    try {
      const response = await getReminders();
      if (response?.success && Array.isArray(response.data)) {
        setReminders(response.data);
      } else {
        throw new Error('Unexpected reminder API response');
      }
    } catch (err) {
      console.warn('Failed to load reminders:', err);
      setRemindersError(err.message || 'Failed to load reminders');
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  // Load notification preferences for the authenticated user
  const loadNotificationPreferences = useCallback(async () => {
    setPreferencesLoading(true);
    setPreferencesError(null);
    try {
      const response = await getNotificationPreferences();
      if (response?.success && response.data) {
        setPreferences(response.data);
      } else {
        throw new Error('Unexpected preferences API response');
      }
    } catch (err) {
      console.warn('Failed to load notification preferences:', err);
      setPreferencesError(err.message || 'Failed to load preferences');
    } finally {
      setPreferencesLoading(false);
    }
  }, []);

  // Effect to load reminders & preferences when the user changes (or on mount)
  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;
    const fetchAll = async () => {
      await loadReminders();
      await loadNotificationPreferences();
    };
    fetchAll();
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // CRUD helpers for reminders
  const addReminder = async (payload) => {
    if (!payload || typeof payload !== 'object') return;
    try {
      const response = await createReminder(payload);
      if (response?.success && response.data) {
        setReminders((prev) => [...prev, response.data]);
        showToast('Reminder added');
      } else {
        throw new Error(response?.message || 'Failed to add reminder');
      }
    } catch (err) {
      console.error('Add reminder error:', err);
      showToast(`Could not add reminder: ${err.message}`);
    }
  };

  const updateReminder = async (id, updates) => {
    if (!id) return;
    try {
      const response = await apiUpdateReminder(id, updates);
      if (response?.success && response.data) {
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...response.data } : r))
        );
        showToast('Reminder updated');
      } else {
        throw new Error(response?.message || 'Failed to update reminder');
      }
    } catch (err) {
      console.error('Update reminder error:', err);
      showToast(`Could not update reminder: ${err.message}`);
    }
  };

  const toggleReminderEnabled = async (id) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;
    const newEnabled = !target.enabled;
    await updateReminder(id, { enabled: newEnabled });
  };

  const deleteReminder = async (id) => {
    try {
      const response = await apiDeleteReminder(id);
      if (response?.success) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        showToast('Reminder deleted');
      } else {
        throw new Error(response?.message || 'Failed to delete reminder');
      }
    } catch (err) {
      console.error('Delete reminder error:', err);
      showToast(`Could not delete reminder: ${err.message}`);
    }
  };

  const updateNotificationPreferences = async (prefs) => {
    try {
      const response = await apiUpdatePreferences(prefs);
      if (response?.success && response.data) {
        setPreferences(response.data);
        showToast('Notification preferences saved');
      } else {
        throw new Error(response?.message || 'Failed to update preferences');
      }
    } catch (err) {
      console.error('Update preferences error:', err);
      showToast(`Could not save preferences: ${err.message}`);
    }
  };

  const addRecommendationToRoutine = (recTitle, category, tag) => {
    const newHabit = {
      id: `rec_habit_${Date.now()}`,
      title: recTitle,
      subtitle: 'Added from Wellness Recommendations',
      description: 'Added from Wellness Recommendations',
      category,
      tag,
      completed: false,
      pinned: true,
      icon: 'sparkles',
    };
    setHabits((prev) => [newHabit, ...prev]);
    showToast(`Added "${recTitle}" to your Daily Checklist!`);
  };

  const stats = useMemo(() => {
    const total = habits.length;
    const completed = habits.filter((h) => h.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      percentage,
      pending: total - completed,
    };
  }, [habits]);

  return (
    <HealthCheckContext.Provider
      value={{
        habits,
        recommendations,
        streakDays,
        stats,
        searchQuery,
        setSearchQuery,
        activeDate,
        setActiveDate,
        toggleHabit,
        addCustomHabit,
        toggleSaveRecommendation,
        addRecommendationToRoutine,
        isQuickCheckInOpen,
        setIsQuickCheckInOpen,
        isAddHabitOpen,
        setIsAddHabitOpen,
        showToast,
        isLoading,
        error,
        dataSource,
        weeklyProgress,
        // Reminder state & helpers
        reminders,
        remindersLoading,
        remindersError,
        loadReminders,
        addReminder,
        updateReminder,
        toggleReminderEnabled,
        deleteReminder,
        // Notification preferences state & helpers
        preferences,
        preferencesLoading,
        preferencesError,
        loadNotificationPreferences,
        updateNotificationPreferences,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[var(--hc-primary)] text-white px-4 py-3 rounded-xl shadow-lg border border-[var(--hc-primary-hover)]/30 transition-all duration-300 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[var(--hc-accent)] animate-ping" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </HealthCheckContext.Provider>
  );
}

export function useHealthCheck() {
  const context = useContext(HealthCheckContext);
  if (!context) {
    throw new Error('useHealthCheck must be used within a HealthCheckProvider');
  }
  return context;
}
