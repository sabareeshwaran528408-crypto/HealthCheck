import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import app from '../src/app.js';
import {
  createNotificationHandlers,
} from '../src/controllers/notificationController.js';

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

// ----------------------------------------------------
// Handler Unit Tests
// ----------------------------------------------------
test('getPreferences initializes default preferences if no row exists', async () => {
  let inserted = false;
  const fakeDb = {
    async query(sql, params) {
      if (sql.startsWith('SELECT browser_notifications')) {
        assert.deepEqual(params, [101]);
        return [[]]; // No existing row
      }
      if (sql.startsWith('INSERT INTO notification_preferences')) {
        assert.deepEqual(params, [101]);
        inserted = true;
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const handlers = createNotificationHandlers(fakeDb);
  const response = createResponse();

  await handlers.getPreferences({ user: { id: 101 } }, response);

  assert.equal(response.statusCode, null);
  assert.equal(response.body.success, true);
  assert.equal(inserted, true);
  assert.deepEqual(response.body.data, {
    browser_notifications: true,
    email_notifications: false,
  });
});

test('getPreferences returns existing preferences formatted as booleans', async () => {
  const fakeDb = {
    async query(sql, params) {
      assert.deepEqual(params, [101]);
      return [
        [
          {
            browser_notifications: 0,
            email_notifications: 1,
          },
        ],
      ];
    },
  };

  const handlers = createNotificationHandlers(fakeDb);
  const response = createResponse();

  await handlers.getPreferences({ user: { id: 101 } }, response);

  assert.equal(response.statusCode, null);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, {
    browser_notifications: false,
    email_notifications: true,
  });
});

test('updatePreferences rejects invalid bodies with 400', async () => {
  const handlers = createNotificationHandlers({});

  // Neither preference provided
  const res1 = createResponse();
  await handlers.updatePreferences({ user: { id: 101 }, body: {} }, res1);
  assert.equal(res1.statusCode, 400);

  // Non-boolean browser_notifications
  const res2 = createResponse();
  await handlers.updatePreferences(
    { user: { id: 101 }, body: { browser_notifications: 'true' } },
    res2
  );
  assert.equal(res2.statusCode, 400);

  // Non-boolean email_notifications
  const res3 = createResponse();
  await handlers.updatePreferences(
    { user: { id: 101 }, body: { email_notifications: 1 } },
    res3
  );
  assert.equal(res3.statusCode, 400);
});

test('updatePreferences updates both preferences and preserves scope', async () => {
  let upsertParams = null;
  const fakeDb = {
    async query(sql, params) {
      if (sql.startsWith('SELECT browser_notifications')) {
        return [[{ browser_notifications: 1, email_notifications: 0 }]];
      }
      if (sql.startsWith('INSERT INTO notification_preferences')) {
        upsertParams = params;
        return [{ affectedRows: 2 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const handlers = createNotificationHandlers(fakeDb);
  const response = createResponse();

  await handlers.updatePreferences(
    {
      user: { id: 101 },
      body: { browser_notifications: false, email_notifications: true },
    },
    response
  );

  assert.equal(response.statusCode, null);
  assert.equal(response.body.success, true);
  assert.deepEqual(upsertParams, [101, 0, 1]);
  assert.deepEqual(response.body.data, {
    browser_notifications: false,
    email_notifications: true,
  });
});

test('updatePreferences preserves unprovided preference when updating only one', async () => {
  let upsertParams = null;
  const fakeDb = {
    async query(sql, params) {
      if (sql.startsWith('SELECT browser_notifications')) {
        return [[{ browser_notifications: 0, email_notifications: 1 }]];
      }
      if (sql.startsWith('INSERT INTO notification_preferences')) {
        upsertParams = params;
        return [{ affectedRows: 2 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const handlers = createNotificationHandlers(fakeDb);
  const response = createResponse();

  // Only update browser_notifications, leave email_notifications intact
  await handlers.updatePreferences(
    {
      user: { id: 101 },
      body: { browser_notifications: true },
    },
    response
  );

  assert.equal(response.statusCode, null);
  assert.equal(response.body.success, true);
  // Preserved email_notifications = 1 from existing record
  assert.deepEqual(upsertParams, [101, 1, 1]);
  assert.deepEqual(response.body.data, {
    browser_notifications: true,
    email_notifications: true,
  });
});

// ----------------------------------------------------
// App Integration & Authentication Test
// ----------------------------------------------------
test('backend protects /api/notifications/preferences endpoints with authentication', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/notifications/preferences`;

    // Unauthenticated GET
    const getRes = await fetch(url);
    assert.equal(getRes.status, 401);

    // Unauthenticated PUT
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browser_notifications: true }),
    });
    assert.equal(putRes.status, 401);

    // Malformed token GET
    const malformedRes = await fetch(url, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    assert.equal(malformedRes.status, 401);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

