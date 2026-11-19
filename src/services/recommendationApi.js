import { apiRequest } from './api';

export function getRecommendations(category) {
  const query = category ? `?${new URLSearchParams({ category })}` : '';
  return apiRequest(`/recommendations${query}`);
}
