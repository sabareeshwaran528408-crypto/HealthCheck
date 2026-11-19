import pool from '../config/db.js';

export function createNotificationHandlers(database = pool) {
  return {
    async getPreferences(req, res) {
      try {
        const userId = req.user.id;
        const [rows] = await database.query(
          'SELECT browser_notifications, email_notifications FROM notification_preferences WHERE user_id = ?',
          [userId]
        );

        if (rows.length === 0) {
          // Initialize default preferences safely
          await database.query(
            `INSERT INTO notification_preferences (user_id, browser_notifications, email_notifications)
             VALUES (?, 1, 0)
             ON DUPLICATE KEY UPDATE user_id = user_id`,
            [userId]
          );

          return res.json({
            success: true,
            data: {
              browser_notifications: true,
              email_notifications: false,
            },
          });
        }

        return res.json({
          success: true,
          data: {
            browser_notifications: Boolean(rows[0].browser_notifications),
            email_notifications: Boolean(rows[0].email_notifications),
          },
        });
      } catch (error) {
        console.error('Error in getPreferences:', error.code || error.name);
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve notification preferences.',
        });
      }
    },

    async updatePreferences(req, res) {
      try {
        const userId = req.user.id;
        const { browser_notifications, email_notifications } = req.body;

        if (browser_notifications === undefined && email_notifications === undefined) {
          return res.status(400).json({
            success: false,
            message: 'At least one preference (browser_notifications or email_notifications) must be provided.',
          });
        }

        if (browser_notifications !== undefined && typeof browser_notifications !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'The browser_notifications field must be a boolean.',
          });
        }

        if (email_notifications !== undefined && typeof email_notifications !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'The email_notifications field must be a boolean.',
          });
        }

        const [existing] = await database.query(
          'SELECT browser_notifications, email_notifications FROM notification_preferences WHERE user_id = ?',
          [userId]
        );

        const currentBrowser = existing.length > 0 ? Boolean(existing[0].browser_notifications) : true;
        const currentEmail = existing.length > 0 ? Boolean(existing[0].email_notifications) : false;

        const newBrowser = browser_notifications !== undefined ? browser_notifications : currentBrowser;
        const newEmail = email_notifications !== undefined ? email_notifications : currentEmail;

        await database.query(
          `INSERT INTO notification_preferences (user_id, browser_notifications, email_notifications)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             browser_notifications = VALUES(browser_notifications),
             email_notifications = VALUES(email_notifications),
             updated_at = CURRENT_TIMESTAMP`,
          [userId, newBrowser ? 1 : 0, newEmail ? 1 : 0]
        );

        return res.json({
          success: true,
          message: 'Notification preferences updated successfully.',
          data: {
            browser_notifications: newBrowser,
            email_notifications: newEmail,
          },
        });
      } catch (error) {
        console.error('Error in updatePreferences:', error.code || error.name);
        return res.status(500).json({
          success: false,
          message: 'Failed to update notification preferences.',
        });
      }
    },
  };
}

const defaultHandlers = createNotificationHandlers(pool);

export const getPreferences = defaultHandlers.getPreferences;
export const updatePreferences = defaultHandlers.updatePreferences;

