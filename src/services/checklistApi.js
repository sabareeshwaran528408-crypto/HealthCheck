import { apiRequest } from './api';

export function getDailyChecklist(date) {
  const query = new URLSearchParams({ date });
  return apiRequest(`/checklist?${query}`);
}

export function updateChecklistItem(itemId, completed, date) {
  return apiRequest(`/checklist/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    body: { completed, date },
  });
}

export function getChecklistByDate(date) {
  return apiRequest(`/checklist/${encodeURIComponent(date)}`);
}
