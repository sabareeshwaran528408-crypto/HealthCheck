import { apiRequest } from './api';

/**
 * Fetch all reminders for the authenticated user.
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export function getReminders() {
  return apiRequest('/reminders');
}

/**
 * Create a new reminder.
 * @param {object} reminder
 * @param {string} reminder.title
 * @param {string} reminder.reminder_time 24-hr time 'HH:MM' or 'HH:MM:SS'
 * @param {boolean} [reminder.enabled=true]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export function createReminder({ title, reminder_time, enabled = true }) {
  return apiRequest('/reminders', {
    method: 'POST',
    body: { title, reminder_time, enabled },
  });
}

/**
 * Update an existing reminder.
 * @param {number|string} id
 * @param {object} updates
 * @param {string} [updates.title]
 * @param {string} [updates.reminder_time]
 * @param {boolean} [updates.enabled]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export function updateReminder(id, updates) {
  return apiRequest(`/reminders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: updates,
  });
}

/**
 * Delete a reminder.
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export function deleteReminder(id) {
  return apiRequest(`/reminders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

