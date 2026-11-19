/**
 * Utilities for formatting, sorting, and finding upcoming reminders.
 */

/**
 * Converts a 24-hr time string ('HH:MM' or 'HH:MM:SS') to 12-hour display ('8:30 AM').
 * @param {string} timeStr
 * @returns {string}
 */
export function formatReminderTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Converts 'HH:MM' or 'HH:MM:SS' to minutes since midnight (0 - 1439).
 * @param {string} timeStr
 * @returns {number}
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return -1;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return -1;

  return hours * 60 + minutes;
}

/**
 * Returns human-readable relative time string from minutes.
 * @param {number} totalMinutes
 * @returns {string}
 */
export function formatMinutesUntil(totalMinutes) {
  if (totalMinutes <= 0) return 'due now';
  if (totalMinutes === 1) return 'in 1 minute';
  if (totalMinutes < 60) return `in ${totalMinutes} minutes`;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) {
    return hours === 1 ? 'in 1 hour' : `in ${hours} hours`;
  }
  return `in ${hours}h ${mins}m`;
}

/**
 * Finds the next upcoming enabled reminder from a list of reminders.
 * @param {Array} reminders
 * @param {Date} [now] Current local time
 * @returns {{ reminder: object, isToday: boolean, minutesUntil: number } | null}
 */
export function getNextUpcomingReminder(reminders, now = new Date()) {
  if (!Array.isArray(reminders) || reminders.length === 0) return null;

  const enabled = reminders.filter((r) => Boolean(r.enabled));
  if (enabled.length === 0) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Sort all enabled reminders chronologically by time
  const sorted = [...enabled].sort((a, b) => {
    return timeStringToMinutes(a.reminder_time) - timeStringToMinutes(b.reminder_time);
  });

  // Reminders scheduled later today
  const laterToday = sorted.filter((r) => timeStringToMinutes(r.reminder_time) > currentMinutes);

  if (laterToday.length > 0) {
    const next = laterToday[0];
    const reminderMinutes = timeStringToMinutes(next.reminder_time);
    return {
      reminder: next,
      isToday: true,
      minutesUntil: reminderMinutes - currentMinutes,
    };
  }

  // If no more reminders today, the earliest one fires tomorrow
  const earliestTomorrow = sorted[0];
  const reminderMinutes = timeStringToMinutes(earliestTomorrow.reminder_time);
  const minutesUntil = (24 * 60 - currentMinutes) + reminderMinutes;

  return {
    reminder: earliestTomorrow,
    isToday: false,
    minutesUntil,
  };
}

/**
 * Validates a reminder title (1-255 characters, not whitespace only).
 * @param {string} title
 * @returns {string|null}
 */
export function validateTitle(title) {
  if (typeof title !== 'string') return null;
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > 255) return null;
  return trimmed;
}

/**
 * Validates a 24-hr time string ('HH:MM').
 * @param {string} timeStr
 * @returns {boolean}
 */
export function validateTimeFormat(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  return /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(timeStr.trim());
}

