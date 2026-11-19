import { apiRequest } from './api';

export function getDailyProgress(date) {
  const query = new URLSearchParams({ date });
  return apiRequest(`/progress/daily?${query}`);
}

export function getWeeklyProgress(startDate, endDate) {
  const query = new URLSearchParams({ startDate, endDate });
  return apiRequest(`/progress/weekly?${query}`);
}
