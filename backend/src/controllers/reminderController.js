import pool from '../config/db.js';

export function validateReminderTitle(title) {
  if (typeof title !== 'string') return null;
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > 255) return null;
  return trimmed;
}

export function normalizeReminderTime(timeStr) {
  if (typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;
  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  const seconds = match[3] !== undefined ? match[3] : '00';
  return `${hours}:${minutes}:${seconds}`;
}

export function parsePositiveInteger(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

export function formatReminder(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    reminder_time: row.reminder_time,
    enabled: Boolean(row.enabled),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function createReminderHandlers(database = pool) {
  return {
    async getReminders(req, res) {
      try {
        const userId = req.user.id;
        const [rows] = await database.query(
          `SELECT
             id,
             user_id,
             title,
             TIME_FORMAT(reminder_time, '%H:%i:%s') AS reminder_time,
             enabled,
             created_at,
             updated_at
           FROM reminders
           WHERE user_id = ?
           ORDER BY reminder_time ASC, id ASC`,
          [userId]
        );

        return res.json({
          success: true,
          data: rows.map(formatReminder),
        });
      } catch (error) {
        console.error('Error in getReminders:', error.code || error.name);
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve reminders.',
        });
      }
    },

    async createReminder(req, res) {
      try {
        const userId = req.user.id;
        const { title, reminder_time, enabled } = req.body;

        const validatedTitle = validateReminderTitle(title);
        if (!validatedTitle) {
          return res.status(400).json({
            success: false,
            message: 'Title is required and must not exceed 255 characters.',
          });
        }

        const normalizedTime = normalizeReminderTime(reminder_time);
        if (!normalizedTime) {
          return res.status(400).json({
            success: false,
            message: 'Invalid reminder time format. Expected HH:MM or HH:MM:SS.',
          });
        }

        if (enabled !== undefined && typeof enabled !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'The enabled field must be a boolean.',
          });
        }

        const isEnabled = enabled !== undefined ? enabled : true;

        const [insertResult] = await database.query(
          `INSERT INTO reminders (user_id, title, reminder_time, enabled)
           VALUES (?, ?, ?, ?)`,
          [userId, validatedTitle, normalizedTime, isEnabled ? 1 : 0]
        );

        const [createdRows] = await database.query(
          `SELECT
             id,
             user_id,
             title,
             TIME_FORMAT(reminder_time, '%H:%i:%s') AS reminder_time,
             enabled,
             created_at,
             updated_at
           FROM reminders
           WHERE id = ?`,
          [insertResult.insertId]
        );

        return res.status(201).json({
          success: true,
          message: 'Reminder created successfully.',
          data: formatReminder(createdRows[0]),
        });
      } catch (error) {
        console.error('Error in createReminder:', error.code || error.name);
        return res.status(500).json({
          success: false,
          message: 'Failed to create reminder.',
        });
      }
    },

    async updateReminder(req, res) {
      try {
        const userId = req.user.id;
        const reminderId = parsePositiveInteger(req.params.id);

        if (!reminderId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid reminder ID. Must be a positive integer.',
          });
        }

        const { title, reminder_time, enabled } = req.body;

        if (title === undefined && reminder_time === undefined && enabled === undefined) {
          return res.status(400).json({
            success: false,
            message: 'At least one field (title, reminder_time, enabled) must be provided for update.',
          });
        }

        let validatedTitle;
        if (title !== undefined) {
          validatedTitle = validateReminderTitle(title);
          if (!validatedTitle) {
            return res.status(400).json({
              success: false,
              message: 'Title must be a non-empty string up to 255 characters.',
            });
          }
        }

        let normalizedTime;
        if (reminder_time !== undefined) {
          normalizedTime = normalizeReminderTime(reminder_time);
          if (!normalizedTime) {
            return res.status(400).json({
              success: false,
              message: 'Invalid reminder time format. Expected HH:MM or HH:MM:SS.',
            });
          }
        }

        if (enabled !== undefined && typeof enabled !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'The enabled field must be a boolean.',
          });
        }

        // Ownership & existence check
        const [existingRows] = await database.query(
          'SELECT id, user_id FROM reminders WHERE id = ? AND user_id = ?',
          [reminderId, userId]
        );

        if (existingRows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Reminder not found.',
          });
        }

        const updates = [];
        const values = [];

        if (validatedTitle !== undefined) {
          updates.push('title = ?');
          values.push(validatedTitle);
        }
        if (normalizedTime !== undefined) {
          updates.push('reminder_time = ?');
          values.push(normalizedTime);
        }
        if (enabled !== undefined) {
          updates.push('enabled = ?');
          values.push(enabled ? 1 : 0);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(reminderId, userId);

        await database.query(
          `UPDATE reminders SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          values
        );

        const [updatedRows] = await database.query(
          `SELECT
             id,
             user_id,
             title,
             TIME_FORMAT(reminder_time, '%H:%i:%s') AS reminder_time,
             enabled,
             created_at,
             updated_at
           FROM reminders
           WHERE id = ? AND user_id = ?`,
          [reminderId, userId]
        );

        return res.json({
          success: true,
          message: 'Reminder updated successfully.',
          data: formatReminder(updatedRows[0]),
        });
      } catch (error) {
        console.error('Error in updateReminder:', error.code || error.name);
        return res.status(500).json({
          success: false,
          message: 'Failed to update reminder.',
        });
      }
    },

    async deleteReminder(req, res) {
      try {
        const userId = req.user.id;
        const reminderId = parsePositiveInteger(req.params.id);

        if (!reminderId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid reminder ID. Must be a positive integer.',
          });
        }

        const [result] = await database.query(
          'DELETE FROM reminders WHERE id = ? AND user_id = ?',
          [reminderId, userId]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Reminder not found.',
          });
        }

        return res.json({
          success: true,
          message: 'Reminder deleted successfully.',
        });
      } catch (error) {
        console.error('Error in deleteReminder:', error.code || error.name);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete reminder.',
        });
      }
    },
  };
}

const defaultHandlers = createReminderHandlers(pool);

export const getReminders = defaultHandlers.getReminders;
export const createReminder = defaultHandlers.createReminder;
export const updateReminder = defaultHandlers.updateReminder;
export const deleteReminder = defaultHandlers.deleteReminder;

