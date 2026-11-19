import { apiRequest } from './api';

/**
 * Fetch notification preferences for the authenticated user.
 * @returns {Promise<{ success: boolean, data: { browser_notifications: boolean, email_notifications: boolean } }>}
 */
export function getNotificationPreferences() {
  return apiRequest('/notifications/preferences');
}

/**
 * Update notification preferences for the authenticated user.
 * @param {object} preferences
 * @param {boolean} [preferences.browser_notifications]
 * @param {boolean} [preferences.email_notifications]
 * @returns {Promise<{ success: boolean, message: string, data: { browser_notifications: boolean, email_notifications: boolean } }>}
 */
export function updateNotificationPreferences(preferences) {
  return apiRequest('/notifications/preferences', {
    method: 'PUT',
    body: preferences,
  });
}

