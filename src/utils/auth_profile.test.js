import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserDisplayName,
  getUserFirstName,
  getUserInitials,
  formatEmailFallback,
  formatMemberSince,
  getTimeBasedGreeting,
} from './user.js';

test('Authenticated user with full_name metadata displays real name and email', () => {
  const user = {
    id: '5853593f-56f9-436b-a4a6-cff32a8def95',
    email: 'sabareeshwaran528408@gmail.com',
    user_metadata: {
      full_name: 'Sabareeshwaran S',
    },
    created_at: '2026-10-24T18:00:00.000Z',
    app_metadata: { provider: 'email' },
    email_confirmed_at: '2026-10-24T18:01:00.000Z',
  };

  const displayName = getUserDisplayName(user);
  const firstName = getUserFirstName(user);
  const initials = getUserInitials(user);
  const memberSince = formatMemberSince(user.created_at);

  assert.equal(displayName, 'Sabareeshwaran S');
  assert.equal(firstName, 'Sabareeshwaran');
  assert.equal(initials, 'SS');
  assert.equal(memberSince, 'October 2026');
  assert.equal(user.email, 'sabareeshwaran528408@gmail.com');
});

test('Authenticated user without name metadata falls back to formatted email', () => {
  const userWithoutName = {
    id: '12345678-abcd-1234-abcd-1234567890ab',
    email: 'john.doe@example.com',
    user_metadata: {},
    created_at: '2026-11-01T10:00:00.000Z',
  };

  const displayName = getUserDisplayName(userWithoutName);
  const firstName = getUserFirstName(userWithoutName);
  const initials = getUserInitials(userWithoutName);

  assert.equal(displayName, 'John Doe');
  assert.equal(firstName, 'John');
  assert.equal(initials, 'JD');
  assert.equal(formatEmailFallback('jane.doe@example.com'), 'Jane Doe');
});

test('Single-word email handles fallback and initials gracefully', () => {
  const user = {
    id: '98765432-fedc-9876-fedc-9876543210fe',
    email: 'sabareeshwaran528408@gmail.com',
    user_metadata: null,
  };

  assert.equal(getUserDisplayName(user), 'Sabareeshwaran528408');
  assert.equal(getUserFirstName(user), 'Sabareeshwaran528408');
  assert.equal(getUserInitials(user), 'SA');
});

test('Missing or null user states produce safe defaults without demo Elena', () => {
  const nullUser = null;
  assert.equal(getUserDisplayName(nullUser), 'HealthCheck Member');
  assert.equal(getUserFirstName(nullUser), 'Friend');
  assert.equal(getUserInitials(nullUser), 'HC');

  // Verify "Elena" is never in the resolved profile
  assert.doesNotMatch(getUserDisplayName(nullUser), /elena/i);
  assert.doesNotMatch(getUserFirstName(nullUser), /elena/i);
});

test('Personalized dashboard greetings match hour of day', () => {
  const morningDate = new Date('2026-11-12T07:30:00');
  const afternoonDate = new Date('2026-11-12T13:45:00');
  const eveningDate = new Date('2026-11-12T19:30:00');

  assert.equal(getTimeBasedGreeting(morningDate), 'Good Morning');
  assert.equal(getTimeBasedGreeting(afternoonDate), 'Good Afternoon');
  assert.equal(getTimeBasedGreeting(eveningDate), 'Good Evening');
});
