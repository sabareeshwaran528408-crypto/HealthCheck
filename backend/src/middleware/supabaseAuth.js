import pool from '../config/db.js';
import { createUserMapper, UserMappingConflictError } from '../services/userMapping.js';

const mapSupabaseUser = createUserMapper(pool);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AuthenticationError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = status;
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new AuthenticationError(503, 'Authentication is not configured.');
  }

  return { url: url.replace(/\/+$/, ''), publishableKey };
}

export async function verifySupabaseAccessToken(accessToken, fetchImpl = fetch) {
  if (typeof accessToken !== 'string' || accessToken.split('.').length !== 3) {
    throw new AuthenticationError(401, 'A valid access token is required.');
  }

  const { url, publishableKey } = getSupabaseConfig();
  let response;
  try {
    // Supabase Auth verifies the JWT signature, issuer, audience, and expiry before returning the user.
    response = await fetchImpl(`${url}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new AuthenticationError(503, 'Authentication verification is unavailable.');
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError(401, 'The access token is invalid or expired.');
  }
  if (!response.ok) {
    throw new AuthenticationError(503, 'Authentication verification is unavailable.');
  }

  let user;
  try {
    user = await response.json();
  } catch {
    throw new AuthenticationError(503, 'Authentication verification is unavailable.');
  }

  if (!user || typeof user !== 'object' || !UUID_PATTERN.test(user.id || '')) {
    throw new AuthenticationError(401, 'The access token did not identify a valid user.');
  }

  return user;
}

export function createSupabaseAuthMiddleware({
  verifyToken = verifySupabaseAccessToken,
  mapUser = mapSupabaseUser,
} = {}) {
  return async function supabaseAuthMiddleware(req, res, next) {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    try {
      const identity = await verifyToken(match[1]);
      req.user = {
        id: await mapUser(identity),
        supabaseUserId: identity.id,
      };
      return next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof UserMappingConflictError) {
        const status = error instanceof UserMappingConflictError ? 409 : error.status;
        return res.status(status).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Supabase authentication or account mapping failed:', error.code || error.name);
      return res.status(503).json({
        success: false,
        message: 'Authentication is temporarily unavailable.',
      });
    }
  };
}

export const supabaseAuthMiddleware = createSupabaseAuthMiddleware();
