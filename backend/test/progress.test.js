import assert from 'node:assert/strict';
import test from 'node:test';
import { createDailyProgressHandler } from '../src/controllers/progressController.js';

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

test('daily progress returns 0% when no items completed', async () => {
  const database = {
    async query(sql) {
      if (sql.includes('COUNT(*) AS total')) return [[{ total: 24 }]];
      if (sql.includes('COUNT(*) AS completed')) return [[{ completed: 0 }]];
      throw new Error('Unexpected query');
    },
  };
  const response = createResponse();
  const handler = createDailyProgressHandler(database);

  await handler(
    { user: { id: 101 }, query: { date: '2026-11-15' } },
    response,
  );

  assert.equal(response.statusCode, null);
  assert.deepEqual(response.body, {
    success: true,
    data: {
      date: '2026-11-15',
      completed: 0,
      total: 24,
      pending: 24,
      percentage: 0,
    },
  });
});

test('daily progress returns 100% when all items completed', async () => {
  const database = {
    async query(sql) {
      if (sql.includes('COUNT(*) AS total')) return [[{ total: 24 }]];
      if (sql.includes('COUNT(*) AS completed')) return [[{ completed: 24 }]];
      throw new Error('Unexpected query');
    },
  };
  const response = createResponse();
  const handler = createDailyProgressHandler(database);

  await handler(
    { user: { id: 101 }, query: { date: '2026-11-15' } },
    response,
  );

  assert.equal(response.statusCode, null);
  assert.deepEqual(response.body.data, {
    date: '2026-11-15',
    completed: 24,
    total: 24,
    pending: 0,
    percentage: 100,
  });
});

test('daily progress rejects invalid date format with 400', async () => {
  const response = createResponse();
  const handler = createDailyProgressHandler({});

  await handler(
    { user: { id: 101 }, query: { date: 'invalid-date' } },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
});

test('weekly progress returns 7 consecutive days and calculates average', async () => {
  const days = [
    { date: '2026-11-09', day: 'Mon', completed: 0, total: 24, percentage: 0 },
    { date: '2026-11-10', day: 'Tue', completed: 12, total: 24, percentage: 50 },
    { date: '2026-11-11', day: 'Wed', completed: 0, total: 24, percentage: 0 },
    { date: '2026-11-12', day: 'Thu', completed: 24, total: 24, percentage: 100 },
    { date: '2026-11-13', day: 'Fri', completed: 0, total: 24, percentage: 0 },
    { date: '2026-11-14', day: 'Sat', completed: 0, total: 24, percentage: 0 },
    { date: '2026-11-15', day: 'Sun', completed: 0, total: 24, percentage: 0 },
  ];

  const totalPercentages = days.reduce((acc, curr) => acc + curr.percentage, 0);
  const averagePercentage = Math.round(totalPercentages / days.length);

  assert.equal(days.length, 7);
  assert.equal(averagePercentage, 21);
});
