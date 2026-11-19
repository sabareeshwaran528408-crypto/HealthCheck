import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import app from '../src/app.js';
import {
  validateReminderTitle,
  normalizeReminderTime,
  parsePositiveInteger,
  formatReminder,
  createReminderHandlers,
} from '../src/controllers/reminderController.js';

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
// Validation Unit Tests
// ----------------------------------------------------
test('validateReminderTitle validates string length and trims whitespace', () => {
  assert.equal(validateReminderTitle(' Drink Water '), 'Drink Water');
  assert.equal(validateReminderTitle('a'), 'a');
  assert.equal(validateReminderTitle(''), null);
  assert.equal(validateReminderTitle('   '), null);
  assert.equal(validateReminderTitle(123), null);
  assert.equal(validateReminderTitle(null), null);
  assert.equal(validateReminderTitle(undefined), null);
  assert.equal(validateReminderTitle('a'.repeat(255)), 'a'.repeat(255));
  assert.equal(validateReminderTitle('a'.repeat(256)), null);
});

test('normalizeReminderTime normalizes valid times and rejects invalid formats', () => {
  assert.equal(normalizeReminderTime('08:30'), '08:30:00');
  assert.equal(normalizeReminderTime('8:30'), '08:30:00');
  assert.equal(normalizeReminderTime('14:45:15'), '14:45:15');
  assert.equal(normalizeReminderTime('00:00:00'), '00:00:00');
  assert.equal(normalizeReminderTime('23:59:59'), '23:59:59');

  // Invalid times
  assert.equal(normalizeReminderTime('24:00'), null);
  assert.equal(normalizeReminderTime('12:60'), null);
  assert.equal(normalizeReminderTime('12:00:60'), null);
  assert.equal(normalizeReminderTime('invalid'), null);
  assert.equal(normalizeReminderTime(''), null);
  assert.equal(normalizeReminderTime(null), null);
  assert.equal(normalizeReminderTime(1230), null);
});

test('parsePositiveInteger parses valid positive integers and rejects others', () => {
  assert.equal(parsePositiveInteger('1'), 1);
  assert.equal(parsePositiveInteger(42), 42);
  assert.equal(parsePositiveInteger('0'), null);
  assert.equal(parsePositiveInteger(-5), null);
  assert.equal(parsePositiveInteger('abc'), null);
  assert.equal(parsePositiveInteger(1.5), null);
  assert.equal(parsePositiveInteger(null), null);
  assert.equal(parsePositiveInteger(undefined), null);
});

test('formatReminder maps database row to formatted response with boolean enabled', () => {
  const row = {
    id: 10,
    user_id: 2,
    title: 'Hydrate',
    reminder_time: '09:00:00',
    enabled: 1,
    created_at: new Date('2026-11-15T08:00:00Z'),
    updated_at: new Date('2026-11-15T08:00:00Z'),
  };

  const formatted = formatReminder(row);
  assert.deepEqual(formatted, {
    id: 10,
    user_id: 2,
    title: 'Hydrate',
    reminder_time: '09:00:00',
    enabled: true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
});

// ----------------------------------------------------
// Handler Unit Tests
// ----------------------------------------------------
test('getReminders returns only the authenticated user\'s reminders ordered by time', async () => {
  const fakeDb = {
    async query(sql, params) {
      assert.match(sql, /WHERE user_id = \?/);
      assert.deepEqual(params, [101]);
      return [
        [
          {
            id: 1,
            user_id: 101,
            title: 'Morning stretch',
            reminder_time: '07:00:00',
            enabled: 1,
            created_at: '2026-11-15 06:00:00',
            updated_at: '2026-11-15 06:00:00',
          },
          {
            id: 2,
            user_id: 101,
            title: 'Drink water',
            reminder_time: '09:30:00',
            enabled: 0,
            created_at: '2026-11-15 06:00:00',
            updated_at: '2026-11-15 06:00:00',
          },
        ],
      ];
    },
  };

  const handlers = createReminderHandlers(fakeDb);
  const response = createResponse();

  await handlers.getReminders({ user: { id: 101 } }, response);

  assert.equal(response.statusCode, null);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.length, 2);
  assert.equal(response.body.data[0].title, 'Morning stretch');
  assert.equal(response.body.data[0].enabled, true);
  assert.equal(response.body.data[1].title, 'Drink water');
  assert.equal(response.body.data[1].enabled, false);
});

test('createReminder inserts a new reminder and returns 201', async () => {
  let insertedValues = null;
  const fakeDb = {
    async query(sql, params) {
      if (sql.includes('INSERT INTO reminders')) {
        insertedValues = params;
        return [{ insertId: 55 }];
      }
      if (sql.includes('WHERE id = ?') && !sql.includes('user_id = ?')) {
        assert.deepEqual(params, [55]);
        return [
          [
            {
              id: 55,
              user_id: insertedValues[0],
              title: insertedValues[1],
              reminder_time: insertedValues[2],
              enabled: insertedValues[3],
              created_at: '2026-11-15 08:00:00',
              updated_at: '2026-11-15 08:00:00',
            },
          ],
        ];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const handlers = createReminderHandlers(fakeDb);
  const response = createResponse();

  await handlers.createReminder(
    {
      user: { id: 101 },
      body: { title: ' Evening Walk ', reminder_time: '18:30' },
    },
    response
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.deepEqual(insertedValues, [101, 'Evening Walk', '18:30:00', 1]);
  assert.equal(response.body.data.id, 55);
  assert.equal(response.body.data.title, 'Evening Walk');
  assert.equal(response.body.data.reminder_time, '18:30:00');
  assert.equal(response.body.data.enabled, true);
});

test('createReminder validates required fields and types', async () => {
  const handlers = createReminderHandlers({});

  // Missing / empty title
  const res1 = createResponse();
  await handlers.createReminder(
    { user: { id: 101 }, body: { title: '   ', reminder_time: '08:00' } },
    res1
  );
  assert.equal(res1.statusCode, 400);

  // Invalid time format
  const res2 = createResponse();
  await handlers.createReminder(
    { user: { id: 101 }, body: { title: 'Walk', reminder_time: '25:00' } },
    res2
  );
  assert.equal(res2.statusCode, 400);

  // Invalid enabled type (not boolean)
  const res3 = createResponse();
  await handlers.createReminder(
    { user: { id: 101 }, body: { title: 'Walk', reminder_time: '08:00', enabled: 'yes' } },
    res3
  );
  assert.equal(res3.statusCode, 400);
});

test('updateReminder prevents modifying another user\'s reminder and returns 404', async () => {
  const fakeDb = {
    async query(sql, _params) {
      if (sql.startsWith('SELECT id, user_id FROM reminders')) {
        // Query looks for id = ? AND user_id = ?
        // Returns empty because reminder belongs to user 202, not 101
        return [[]];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const handlers = createReminderHandlers(fakeDb);
  const response = createResponse();

  await handlers.updateReminder(
    {
      user: { id: 101 },
      params: { id: '7' },
      body: { title: 'Hacked Title' },
    },
    response
  );

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Reminder not found.');
});

test('updateReminder successfully updates provided fields', async () => {
  let updateParams = null;
  const fakeDb = {
    async query(sql, params) {
      if (sql.startsWith('SELECT id, user_id FROM reminders')) {
        return [[{ id: 7, user_id: 101 }]];
      }
      if (sql.startsWith('UPDATE reminders SET')) {
        updateParams = params;
        return [{ affectedRows: 1 }];
      }
      if (sql.includes('WHERE id = ? AND user_id = ?')) {
        return [
          [
            {
              id: 7,
              user_id: 101,
              title: 'Updated Title',
              reminder_time: '10:00:00',
              enabled: 0,
              created_at: '2026-11-15 08:00:00',
              updated_at: '2026-11-15 09:00:00',
            },
          ],
        ];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const handlers = createReminderHandlers(fakeDb);
  const response = createResponse();

  await handlers.updateReminder(
    {
      user: { id: 101 },
      params: { id: '7' },
      body: { title: 'Updated Title', reminder_time: '10:00', enabled: false },
    },
    response
  );

  assert.equal(response.statusCode, null);
  assert.equal(response.body.success, true);
  assert.deepEqual(updateParams, ['Updated Title', '10:00:00', 0, 7, 101]);
  assert.equal(response.body.data.enabled, false);
  assert.equal(response.body.data.title, 'Updated Title');
});

test('updateReminder rejects empty body or invalid params with 400', async () => {
  const handlers = createReminderHandlers({});

  // Invalid ID
  const res1 = createResponse();
  await handlers.updateReminder(
    { user: { id: 101 }, params: { id: 'invalid' }, body: { enabled: true } },
    res1
  );
  assert.equal(res1.statusCode, 400);

  // Empty update body
  const res2 = createResponse();
  await handlers.updateReminder(
    { user: { id: 101 }, params: { id: '1' }, body: {} },
    res2
  );
  assert.equal(res2.statusCode, 400);
});

test('deleteReminder returns 404 if reminder does not exist or belongs to another user', async () => {
  const fakeDb = {
    async query(sql, params) {
      assert.match(sql, /DELETE FROM reminders WHERE id = \? AND user_id = \?/);
      assert.deepEqual(params, [99, 101]);
      return [{ affectedRows: 0 }];
    },
  };

  const handlers = createReminderHandlers(fakeDb);
  const response = createResponse();

  await handlers.deleteReminder(
    { user: { id: 101 }, params: { id: '99' } },
    response
  );

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.success, false);
});

test('deleteReminder removes the reminder and returns 200', async () => {
  const fakeDb = {
    async query(sql, params) {
      assert.match(sql, /DELETE FROM reminders WHERE id = \? AND user_id = \?/);
      assert.deepEqual(params, [42, 101]);
      return [{ affectedRows: 1 }];
    },
  };

  const handlers = createReminderHandlers(fakeDb);
  const response = createResponse();

  await handlers.deleteReminder(
    { user: { id: 101 }, params: { id: '42' } },
    response
  );

  assert.equal(response.statusCode, null);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'Reminder deleted successfully.');
});

// ----------------------------------------------------
// App Integration & Authentication Test
// ----------------------------------------------------
test('backend protects /api/reminders endpoints with authentication', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api/reminders`;

    // Unauthenticated GET
    const getRes = await fetch(baseUrl);
    assert.equal(getRes.status, 401);

    // Unauthenticated POST
    const postRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', reminder_time: '08:00' }),
    });
    assert.equal(postRes.status, 401);

    // Malformed token PATCH
    const patchRes = await fetch(`${baseUrl}/1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token',
      },
      body: JSON.stringify({ title: 'Test' }),
    });
    assert.equal(patchRes.status, 401);

    // Malformed token DELETE
    const deleteRes = await fetch(`${baseUrl}/1`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer invalid-token' },
    });
    assert.equal(deleteRes.status, 401);
  } finally {
    server.close();
    await once(server, 'close');
  }
});
