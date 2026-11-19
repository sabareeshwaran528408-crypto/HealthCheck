import pool from '../config/db.js';

const DEV_USER_EMAIL = 'dev@healthcheck.local';
const DEV_USER_NAME = 'HealthCheck Development User';

async function getOrCreateDevUser() {
  const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [DEV_USER_EMAIL],
  );

  if (existingUsers.length > 0) {
    return existingUsers[0].id;
  }

  const [result] = await pool.query(
    `INSERT INTO users (name, email)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [DEV_USER_NAME, DEV_USER_EMAIL],
  );

  return result.insertId;
}

export async function devUserMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEV_AUTH !== 'true') {
    return res.status(401).json({
      success: false,
      message: 'Authentication is required.',
    });
  }

  try {
    req.user = { id: await getOrCreateDevUser() };
    return next();
  } catch (error) {
    console.error('Failed to resolve the development user:', error.code || error.name);
    return res.status(503).json({
      success: false,
      message: 'Development authentication is unavailable.',
    });
  }
}
