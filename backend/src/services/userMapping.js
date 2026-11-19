export class UserMappingConflictError extends Error {
  constructor() {
    super('The authenticated account cannot be mapped automatically.');
    this.name = 'UserMappingConflictError';
  }
}

function resolveName(user) {
  const metadata = user.user_metadata || {};
  const candidate = typeof metadata.full_name === 'string'
    ? metadata.full_name
    : metadata.name;
  const name = typeof candidate === 'string' ? candidate.trim() : '';
  return name ? name.slice(0, 100) : 'HealthCheck member';
}

export function createUserMapper(pool) {
  return async function mapSupabaseUser(user) {
    const [mappedUsers] = await pool.query(
      'SELECT id FROM users WHERE supabase_user_id = ? LIMIT 1',
      [user.id],
    );

    if (mappedUsers.length > 0) {
      return mappedUsers[0].id;
    }

    if (typeof user.email !== 'string' || !user.email.trim()) {
      throw new UserMappingConflictError();
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, supabase_user_id) VALUES (?, ?, ?)',
        [resolveName(user), user.email, user.id],
      );
      return result.insertId;
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        throw error;
      }

      const [concurrentMapping] = await pool.query(
        'SELECT id FROM users WHERE supabase_user_id = ? LIMIT 1',
        [user.id],
      );
      if (concurrentMapping.length > 0) {
        return concurrentMapping[0].id;
      }

      throw new UserMappingConflictError();
    }
  };
}
