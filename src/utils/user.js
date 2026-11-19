/**
 * Utility functions for user profile data resolution and formatting.
 */

/**
 * Derives a human-friendly name from an email address local-part.
 * e.g., 'john.doe@example.com' -> 'John Doe'
 * e.g., 'sabareeshwaran528408@gmail.com' -> 'Sabareeshwaran528408'
 * @param {string} email
 * @returns {string}
 */
export function formatEmailFallback(email) {
  if (typeof email !== 'string' || !email.includes('@')) {
    return 'HealthCheck Member';
  }

  const localPart = email.split('@')[0].trim();
  if (!localPart) {
    return 'HealthCheck Member';
  }

  // Replace common delimiters (dots, underscores, hyphens, pluses) with spaces
  const cleaned = localPart.replace(/[._+-]+/g, ' ').trim();
  if (!cleaned) {
    return 'HealthCheck Member';
  }

  // Capitalize words
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Resolves the display name for a Supabase user.
 * Priority:
 * 1. user_metadata.full_name
 * 2. user_metadata.name
 * 3. user_metadata.display_name
 * 4. Email local-part formatting
 * 5. Fallback string 'HealthCheck Member'
 *
 * @param {object|null} user
 * @returns {string}
 */
export function getUserDisplayName(user) {
  if (!user || typeof user !== 'object') {
    return 'HealthCheck Member';
  }

  const metadata = user.user_metadata || {};
  const candidates = [metadata.full_name, metadata.name, metadata.display_name];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  if (typeof user.email === 'string' && user.email.trim().length > 0) {
    return formatEmailFallback(user.email);
  }

  return 'HealthCheck Member';
}

/**
 * Returns the first name / greeting name of the user.
 * @param {object|null} user
 * @returns {string}
 */
export function getUserFirstName(user) {
  const displayName = getUserDisplayName(user);
  if (displayName === 'HealthCheck Member') {
    return 'Friend';
  }
  const firstWord = displayName.split(/\s+/)[0];
  return firstWord || displayName;
}

/**
 * Generates 1-2 uppercase initials for avatar display.
 * @param {object|null} user
 * @returns {string}
 */
export function getUserInitials(user) {
  const displayName = getUserDisplayName(user);
  if (!displayName || displayName === 'HealthCheck Member') {
    return 'HC';
  }

  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 1) {
    return words[0].slice(0, Math.min(2, words[0].length)).toUpperCase();
  }
  return 'HC';
}

/**
 * Formats a membership creation date into 'Month Year' or 'Recent Member'.
 * @param {string|Date|null} createdAt
 * @returns {string}
 */
export function formatMemberSince(createdAt) {
  if (!createdAt) return 'Recent Member';
  try {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Recent Member';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Recent Member';
  }
}

/**
 * Returns a time-appropriate greeting ('Good Morning', 'Good Afternoon', 'Good Evening').
 * @param {Date} [now]
 * @returns {string}
 */
export function getTimeBasedGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

