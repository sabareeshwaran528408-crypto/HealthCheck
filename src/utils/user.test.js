import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatEmailFallback,
  getUserDisplayName,
  getUserFirstName,
  getUserInitials,
  formatMemberSince,
  getTimeBasedGreeting,
} from './user.js';

test('formatEmailFallback formats email prefixes into names', () => {
  assert.equal(formatEmailFallback('john.doe@example.com'), 'John Doe');
  assert.equal(formatEmailFallback('jane_smith@corp.org'), 'Jane Smith');
  assert.equal(formatEmailFallback('sabareeshwaran528408@gmail.com'), 'Sabareeshwaran528408');
  assert.equal(formatEmailFallback('alex-taylor@test.com'), 'Alex Taylor');
  assert.equal(formatEmailFallback(''), 'HealthCheck Member');
  assert.equal(formatEmailFallback(null), 'HealthCheck Member');
  assert.equal(formatEmailFallback('invalid-no-at'), 'HealthCheck Member');
});

test('getUserDisplayName prioritizes user_metadata over email fallback', () => {
  const fullMetaUser = {
    email: 'user@example.com',
    user_metadata: { full_name: 'Sabareeshwaran S' },
  };
  assert.equal(getUserDisplayName(fullMetaUser), 'Sabareeshwaran S');

  const nameMetaUser = {
    email: 'user@example.com',
    user_metadata: { name: 'Alex Johnson' },
  };
  assert.equal(getUserDisplayName(nameMetaUser), 'Alex Johnson');

  const displayNameMetaUser = {
    email: 'user@example.com',
    user_metadata: { display_name: 'Jordan Lee' },
  };
  assert.equal(getUserDisplayName(displayNameMetaUser), 'Jordan Lee');

  const noMetaUser = {
    email: 'elena.rostova@healthcheck.test',
    user_metadata: {},
  };
  assert.equal(getUserDisplayName(noMetaUser), 'Elena Rostova');

  const blankMetaUser = {
    email: 'dr.watson@hospital.org',
    user_metadata: { full_name: '   ' },
  };
  assert.equal(getUserDisplayName(blankMetaUser), 'Dr Watson');

  assert.equal(getUserDisplayName(null), 'HealthCheck Member');
  assert.equal(getUserDisplayName({}), 'HealthCheck Member');
});

test('getUserFirstName returns first word or greeting name', () => {
  assert.equal(getUserFirstName({ user_metadata: { full_name: 'Sabareeshwaran S' } }), 'Sabareeshwaran');
  assert.equal(getUserFirstName({ email: 'john.doe@example.com' }), 'John');
  assert.equal(getUserFirstName({ email: 'singleword@example.com' }), 'Singleword');
  assert.equal(getUserFirstName(null), 'Friend');
});

test('getUserInitials extracts initials accurately', () => {
  assert.equal(getUserInitials({ user_metadata: { full_name: 'Sabareeshwaran S' } }), 'SS');
  assert.equal(getUserInitials({ user_metadata: { full_name: 'Elena Vance' } }), 'EV');
  assert.equal(getUserInitials({ email: 'john.doe@example.com' }), 'JD');
  assert.equal(getUserInitials({ email: 'sabar@example.com' }), 'SA');
  assert.equal(getUserInitials(null), 'HC');
});

test('formatMemberSince formats dates nicely', () => {
  assert.equal(formatMemberSince('2026-10-15T12:00:00Z'), 'October 2026');
  assert.equal(formatMemberSince(null), 'Recent Member');
  assert.equal(formatMemberSince('invalid-date'), 'Recent Member');
});

test('getTimeBasedGreeting returns appropriate greetings based on hour', () => {
  assert.equal(getTimeBasedGreeting(new Date('2026-11-12T08:00:00')), 'Good Morning');
  assert.equal(getTimeBasedGreeting(new Date('2026-11-12T14:00:00')), 'Good Afternoon');
  assert.equal(getTimeBasedGreeting(new Date('2026-11-12T20:00:00')), 'Good Evening');
});

