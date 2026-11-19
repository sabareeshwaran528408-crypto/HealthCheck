import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatReminderTime,
  timeStringToMinutes,
  formatMinutesUntil,
  getNextUpcomingReminder,
  validateTitle,
  validateTimeFormat,
} from './reminders.js';

test('formatReminderTime converts 24h string to 12h AM/PM string', () => {
  assert.equal(formatReminderTime('00:00:00'), '12:00 AM');
  assert.equal(formatReminderTime('08:30:00'), '8:30 AM');
  assert.equal(formatReminderTime('08:30'), '8:30 AM');
  assert.equal(formatReminderTime('12:00:00'), '12:00 PM');
  assert.equal(formatReminderTime('13:45:00'), '1:45 PM');
  assert.equal(formatReminderTime('23:59:59'), '11:59 PM');
  assert.equal(formatReminderTime(''), '');
  assert.equal(formatReminderTime(null), '');
});

test('timeStringToMinutes converts time string into minutes from midnight', () => {
  assert.equal(timeStringToMinutes('00:00'), 0);
  assert.equal(timeStringToMinutes('01:30'), 90);
  assert.equal(timeStringToMinutes('10:00:00'), 600);
  assert.equal(timeStringToMinutes('23:59'), 1439);
  assert.equal(timeStringToMinutes('invalid'), -1);
});

test('formatMinutesUntil formats relative durations correctly', () => {
  assert.equal(formatMinutesUntil(0), 'due now');
  assert.equal(formatMinutesUntil(-5), 'due now');
  assert.equal(formatMinutesUntil(1), 'in 1 minute');
  assert.equal(formatMinutesUntil(45), 'in 45 minutes');
  assert.equal(formatMinutesUntil(60), 'in 1 hour');
  assert.equal(formatMinutesUntil(120), 'in 2 hours');
  assert.equal(formatMinutesUntil(90), 'in 1h 30m');
});

test('getNextUpcomingReminder returns null when list is empty or all disabled', () => {
  assert.equal(getNextUpcomingReminder([]), null);
  assert.equal(
    getNextUpcomingReminder([
      { id: 1, title: 'Drink water', reminder_time: '10:00:00', enabled: false },
      { id: 2, title: 'Stretch', reminder_time: '14:00:00', enabled: false },
    ]),
    null
  );
});

test('getNextUpcomingReminder picks next reminder later today', () => {
  // Mock current time: 10:15 AM (615 minutes)
  const now = new Date('2026-11-15T10:15:00');
  const reminders = [
    { id: 1, title: 'Morning water', reminder_time: '08:00:00', enabled: true },
    { id: 2, title: 'Afternoon stretch', reminder_time: '14:00:00', enabled: true },
    { id: 3, title: 'Night wind-down', reminder_time: '21:30:00', enabled: true },
  ];

  const result = getNextUpcomingReminder(reminders, now);
  assert.notEqual(result, null);
  assert.equal(result.reminder.id, 2);
  assert.equal(result.isToday, true);
  // 14:00 is 840 mins; 840 - 615 = 225 mins
  assert.equal(result.minutesUntil, 225);
});

test('getNextUpcomingReminder rolls over to earliest reminder tomorrow when none remain today', () => {
  // Mock current time: 22:00 (1320 minutes)
  const now = new Date('2026-11-15T22:00:00');
  const reminders = [
    { id: 1, title: 'Morning water', reminder_time: '08:00:00', enabled: true },
    { id: 2, title: 'Afternoon stretch', reminder_time: '14:00:00', enabled: true },
  ];

  const result = getNextUpcomingReminder(reminders, now);
  assert.notEqual(result, null);
  assert.equal(result.reminder.id, 1);
  assert.equal(result.isToday, false);
  // Time left today: 1440 - 1320 = 120 mins; tomorrow until 08:00 = 480 mins; total = 600 mins
  assert.equal(result.minutesUntil, 600);
});

test('validateTitle and validateTimeFormat validate inputs accurately', () => {
  assert.equal(validateTitle(' Drink Water '), 'Drink Water');
  assert.equal(validateTitle(''), null);
  assert.equal(validateTitle('   '), null);
  assert.equal(validateTitle('a'.repeat(256)), null);

  assert.equal(validateTimeFormat('08:30'), true);
  assert.equal(validateTimeFormat('8:30'), true);
  assert.equal(validateTimeFormat('23:59:00'), true);
  assert.equal(validateTimeFormat('24:00'), false);
  assert.equal(validateTimeFormat('invalid'), false);
});

