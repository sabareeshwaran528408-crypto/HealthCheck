import { supabase } from '../auth/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

const STATUS_MESSAGES = {
  400: 'The request was invalid. Check the submitted information.',
  401: 'Authentication is required to complete this request.',
  403: 'You do not have permission to complete this request.',
  404: 'The requested resource was not found.',
  500: 'The server encountered an error. Please try again later.',
};

export class ApiError extends Error {
  constructor(message, { status = null, code = 'API_ERROR', details = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, signal } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('API is not configured. Set VITE_API_BASE_URL to enable API requests.', {
      code: 'API_NOT_CONFIGURED',
    });
  }

  const normalizedMethod = method.toUpperCase();
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)) {
    throw new ApiError(`Unsupported API method: ${normalizedMethod}`, { code: 'INVALID_METHOD' });
  }

  const requestHeaders = new Headers({ Accept: 'application/json', ...headers });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new ApiError('Your session could not be verified. Please sign in again.', {
      status: 401,
      code: 'SESSION_UNAVAILABLE',
      cause: sessionError,
    });
  }
  if (session?.access_token) {
    requestHeaders.set('Authorization', `Bearer ${session.access_token}`);
  }

  const requestOptions = {
    method: normalizedMethod,
    headers: requestHeaders,
    signal,
  };

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    requestOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    const endpoint = path.startsWith('/') ? path : `/${path}`;
    response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
  } catch (error) {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', {
      code: 'NETWORK_ERROR',
      cause: error,
    });
  }

  if (response.status === 204) return null;

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      if (response.ok) {
        throw new ApiError('The server returned an invalid JSON response.', {
          status: response.status,
          code: 'INVALID_JSON',
          cause: error,
        });
      }
    }
  }

  if (!response.ok) {
    const message = data && typeof data.message === 'string'
      ? data.message
      : STATUS_MESSAGES[response.status] || `The request failed with status ${response.status}.`;
    throw new ApiError(message, {
      status: response.status,
      code: 'HTTP_ERROR',
      details: data,
    });
  }

  return data;
}
