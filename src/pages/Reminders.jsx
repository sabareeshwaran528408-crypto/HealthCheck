import React, { useState, useEffect } from 'react';
import { useHealthCheck } from '../context/HealthCheckContext';
import {
  formatReminderTime,
  validateTitle,
  validateTimeFormat,
} from '../utils/reminders';

export default function Reminders() {
  const {
    reminders,
    remindersLoading,
    remindersError,
    loadReminders,
    addReminder,
    updateReminder,
    toggleReminderEnabled,
    deleteReminder,
    preferences,
    preferencesLoading,
    preferencesError,
    loadNotificationPreferences,
    updateNotificationPreferences,
  } = useHealthCheck();

  // Load data on mount
  useEffect(() => {
    loadReminders();
    loadNotificationPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New reminder form state
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  // Editing state per reminder (store id of reminder being edited)
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');

  const handleAdd = async () => {
    const title = validateTitle(newTitle);
    const timeValid = validateTimeFormat(newTime);
    if (!title) {
      alert('Please enter a valid title (1-255 characters).');
      return;
    }
    if (!timeValid) {
      alert('Please enter a valid time in HH:MM (24‑hr) format.');
      return;
    }
    await addReminder({ title, reminder_time: newTime, enabled: true });
    setNewTitle('');
    setNewTime('');
  };

  const startEdit = (rem) => {
    setEditId(rem.id);
    setEditTitle(rem.title);
    setEditTime(rem.reminder_time);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle('');
    setEditTime('');
  };

  const handleUpdate = async (id) => {
    const title = validateTitle(editTitle);
    const timeValid = validateTimeFormat(editTime);
    if (!title) {
      alert('Please enter a valid title (1-255 characters).');
      return;
    }
    if (!timeValid) {
      alert('Please enter a valid time in HH:MM (24‑hr) format.');
      return;
    }
    await updateReminder(id, { title, reminder_time: editTime });
    cancelEdit();
  };

  const handleToggle = async (id) => {
    await toggleReminderEnabled(id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this reminder? This cannot be undone.')) {
      await deleteReminder(id);
    }
  };

  const handlePrefChange = async (field, value) => {
    await updateNotificationPreferences({ ...preferences, [field]: value });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-[var(--hc-ink)] font-manrope">Reminders</h2>
      </div>

      {/* Preference toggles */}
      <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-6 max-w-2xl shadow-xs">
        <h3 className="text-sm font-semibold mb-3 text-[var(--hc-ink)]">Notification Preferences</h3>
        {preferencesLoading ? (
          <p className="text-xs text-[var(--hc-muted)]">Loading preferences…</p>
        ) : preferencesError ? (
          <p className="text-xs text-red-600">{preferencesError}</p>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(preferences.browser_notifications)}
                onChange={(e) => handlePrefChange('browser_notifications', e.target.checked)}
                className="form-checkbox h-4 w-4 text-[var(--hc-primary)]"
              />
              Browser notifications
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(preferences.email_notifications)}
                onChange={(e) => handlePrefChange('email_notifications', e.target.checked)}
                className="form-checkbox h-4 w-4 text-[var(--hc-primary)]"
              />
              Email notifications
            </label>
          </div>
        )}
      </div>

      {/* Add Reminder Form */}
      <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-6 max-w-2xl shadow-xs">
        <h3 className="text-sm font-semibold mb-3 text-[var(--hc-ink)]">Add Reminder</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="border border-[var(--hc-border)] rounded px-2 py-1"
          />
          <input
            type="time"
            placeholder="Time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="border border-[var(--hc-border)] rounded px-2 py-1"
          />
        </div>
        <button
          onClick={handleAdd}
          className="mt-3 inline-flex items-center gap-1 rounded bg-[var(--hc-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--hc-primary-hover)]"
        >
          Add Reminder
        </button>
      </div>

      {/* Reminders List */}
      <div className="bg-white rounded-2xl border border-[var(--hc-border)] p-6 max-w-2xl shadow-xs">
        <h3 className="text-sm font-semibold mb-3 text-[var(--hc-ink)]">Your Reminders</h3>

        {remindersLoading ? (
          <p className="text-xs text-[var(--hc-muted)]">Loading reminders…</p>
        ) : remindersError ? (
          <div className="text-xs text-red-600 space-y-2">
            <p>{remindersError}</p>
            <button
              onClick={loadReminders}
              className="inline-flex items-center gap-1 rounded bg-[var(--hc-primary)] px-2 py-0.5 text-xs font-medium text-white hover:bg-[var(--hc-primary-hover)]"
            >
              Retry
            </button>
          </div>
        ) : reminders.length === 0 ? (
          <p className="text-xs text-[var(--hc-muted)]">No reminders yet. Add one above.</p>
        ) : (
          <ul className="space-y-3">
            {reminders.map((rem) => (
              <li key={rem.id} className="flex items-center justify-between border-b pb-2">
                {editId === rem.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="border border-[var(--hc-border)] rounded px-2 py-1 w-full"
                    />
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="border border-[var(--hc-border)] rounded px-2 py-1 w-full"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdate(rem.id)}
                        className="inline-flex items-center gap-1 rounded bg-[var(--hc-primary)] px-2 py-0.5 text-xs font-medium text-white hover:bg-[var(--hc-primary-hover)]"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded bg-gray-300 px-2 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--hc-ink)]">{rem.title}</span>
                      <span className="text-xs text-[var(--hc-muted)]">
                        {formatReminderTime(rem.reminder_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean(rem.enabled)}
                          onChange={() => handleToggle(rem.id)}
                          className="form-checkbox h-4 w-4 text-[var(--hc-primary)]"
                        />
                        Enabled
                      </label>
                      <button
                        onClick={() => startEdit(rem)}
                        className="text-xs text-[var(--hc-primary)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rem.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
