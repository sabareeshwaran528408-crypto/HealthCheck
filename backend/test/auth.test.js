import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import app from '../src/app.js';
import { createSupabaseAuthMiddleware, AuthenticationError, verifySupabaseAccessToken } from '../src/middleware/supabaseAuth.js';
import { devUserMiddleware } from '../src/middleware/devUser.js';
import { createUserMapper, UserMappingConflictError } from '../src/services/userMapping.js';
import { createDailyProgressHandler } from '../src/controllers/progressController.js';

const identity = (id, email) => ({
  id,
  email,
  user_metadata: { full_name: 'Test Member' },
});

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function fakePool({ users = [] } = {}) {
  const records = users.map((user) => ({ ...user }));
  let nextId = Math.max(0, ...records.map((user) => user.id)) + 1;

  return {
    records,
    async query(sql, parameters) {
      if (sql.startsWith('SELECT id FROM users WHERE supabase_user_id')) {
        const user = records.find((record) => record.supabase_user_id === parameters[0]);
        return [user ? [{ id: user.id }] : []];
      }

      if (sql.startsWith('INSERT INTO users')) {
        const [name, email, supabaseUserId] = parameters;
        if (records.some((record) => record.email === email || record.supabase_user_id === supabaseUserId)) {
          const error = new Error('duplicate key');
          error.code = 'ER_DUP_ENTRY';
          throw error;
        }
        const id = nextId++;
        records.push({ id, name, email, supabase_user_id: supabaseUserId });
        return [{ insertId: id }];
      }

      throw new Error('Unexpected query in test fake.');
    },
  };
}

test('protected middleware rejects missing and malformed bearer tokens', async () => {
  let verifierCalled = false;
  const middleware = createSupabaseAuthMiddleware({
    verifyToken: async () => {
      verifierCalled = true;
      return identity('11111111-1111-4111-8111-111111111111', 'test@example.invalid');
    },
    mapUser: async () => 1,
  });
  const response = createResponse();
  await middleware({ get: () => undefined }, response, () => assert.fail('next must not run'));
  assert.equal(response.statusCode, 401);
  assert.equal(verifierCalled, false);

  const malformedResponse = createResponse();
  await middleware({ get: () => 'Basic not-a-bearer' }, malformedResponse, () => assert.fail('next must not run'));
  assert.equal(malformedResponse.statusCode, 401);
});

test('protected middleware rejects Supabase-invalid tokens and mapping conflicts', async () => {
  const invalidMiddleware = createSupabaseAuthMiddleware({
    verifyToken: async () => {
      throw new AuthenticationError(401, 'Invalid or expired token.');
    },
    mapUser: async () => assert.fail('invalid identity must not be mapped'),
  });
  const invalidResponse = createResponse();
  await invalidMiddleware({ get: () => 'Bearer a.b.c' }, invalidResponse, () => assert.fail('next must not run'));
  assert.equal(invalidResponse.statusCode, 401);

  const conflictMiddleware = createSupabaseAuthMiddleware({
    verifyToken: async () => identity('11111111-1111-4111-8111-111111111111', 'test@example.invalid'),
    mapUser: async () => {
      throw new UserMappingConflictError();
    },
  });
  const conflictResponse = createResponse();
  await conflictMiddleware({ get: () => 'Bearer a.b.c' }, conflictResponse, () => assert.fail('next must not run'));
  assert.equal(conflictResponse.statusCode, 409);
});

test('Supabase Auth 401 responses reject invalid, expired, or claim-mismatched tokens', async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = 'https://auth-test.example.invalid';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
  try {
    for (const tokenCase of ['invalid', 'expired', 'wrong issuer', 'wrong audience']) {
      let requestedUrl;
      let requestHeaders;
      await assert.rejects(
        verifySupabaseAccessToken('header.payload.signature', async (url, options) => {
          requestedUrl = url;
          requestHeaders = options.headers;
          return { status: 401, ok: false };
        }),
        (error) => error instanceof AuthenticationError && error.status === 401,
        tokenCase,
      );
      assert.equal(requestedUrl, 'https://auth-test.example.invalid/auth/v1/user');
      assert.equal(requestHeaders.Authorization, 'Bearer header.payload.signature');
    }
  } finally {
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});

test('user mapper creates a separate mapping without linking a legacy email match', async () => {
  const legacy = { id: 7, email: 'legacy@example.invalid', supabase_user_id: null };
  const pool = fakePool({ users: [legacy] });
  const mapUser = createUserMapper(pool);
  await assert.rejects(
    mapUser(identity('22222222-2222-4222-8222-222222222222', legacy.email)),
    UserMappingConflictError,
  );
  assert.equal(pool.records.length, 1);
  assert.equal(pool.records[0].supabase_user_id, null);
});

test('user mapper safely resolves concurrent first requests for one Supabase identity', async () => {
  const pool = fakePool();
  const mapUser = createUserMapper(pool);
  const user = identity('33333333-3333-4333-8333-333333333333', 'new@example.invalid');
  const ids = await Promise.all([mapUser(user), mapUser(user)]);
  assert.equal(ids[0], ids[1]);
  assert.equal(pool.records.length, 1);
  assert.equal(pool.records[0].supabase_user_id, user.id);
});

test('middleware scopes req.user.id to the verified Supabase identity', async () => {
  const mappedIds = new Map([
    ['44444444-4444-4444-8444-444444444444', 10],
    ['55555555-5555-4555-8555-555555555555', 11],
  ]);
  const middleware = createSupabaseAuthMiddleware({
    verifyToken: async (token) => identity(token === 'first' ? [...mappedIds.keys()][0] : [...mappedIds.keys()][1], 'test@example.invalid'),
    mapUser: async (user) => mappedIds.get(user.id),
  });

  const observedIds = [];
  for (const token of ['first', 'second']) {
    const response = createResponse();
    const request = { get: () => `Bearer ${token}` };
    await middleware(
      request,
      response,
      () => {},
    );
    assert.equal(response.statusCode, null);
    observedIds.push(request.user.id);
  }
  assert.deepEqual(observedIds, [10, 11]);
});

test('development authentication is disabled in production even when explicitly enabled', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDevAuth = process.env.ENABLE_DEV_AUTH;
  process.env.NODE_ENV = 'production';
  process.env.ENABLE_DEV_AUTH = 'true';
  try {
    const response = createResponse();
    await devUserMiddleware({}, response, () => assert.fail('production dev auth must not call next'));
    assert.equal(response.statusCode, 401);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalDevAuth === undefined) delete process.env.ENABLE_DEV_AUTH;
    else process.env.ENABLE_DEV_AUTH = originalDevAuth;
  }
});

test('backend starts and protects checklist and progress routes without database access', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const { port } = server.address();
    for (const route of ['/api/checklist', '/api/progress/daily']) {
      const response = await fetch(`http://127.0.0.1:${port}${route}`);
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        success: false,
        message: 'Authentication is required.',
      });

      const invalidResponse = await fetch(`http://127.0.0.1:${port}${route}`, {
        headers: { Authorization: 'Bearer malformed-token' },
      });
      assert.equal(invalidResponse.status, 401);
    }
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('daily progress GET performs reads only and returns calculated progress', async () => {
  const queries = [];
  const database = {
    async query(sql) {
      queries.push(sql.trim().split(/\s+/, 1)[0].toUpperCase());
      if (sql.includes('COUNT(*) AS total')) return [[{ total: 24 }]];
      if (sql.includes('COUNT(*) AS completed')) return [[{ completed: 6 }]];
      throw new Error('Unexpected query in progress test.');
    },
  };
  const response = createResponse();
  const handler = createDailyProgressHandler(database);

  await handler(
    { user: { id: 7001 }, query: { date: '2026-01-03' } },
    response,
  );

  assert.deepEqual(queries, ['SELECT', 'SELECT']);
  assert.equal(response.statusCode, null);
  assert.deepEqual(response.body.data, {
    date: '2026-01-03',
    completed: 6,
    total: 24,
    pending: 18,
    percentage: 25,
  });
});
