import pool from '../config/db.js';
import { isValidDate, getTodayDate } from '../utils/date.js';

/**
 * Shared query to retrieve checklist items with user completion status for a given date.
 * @param {number} userId
 * @param {string} date
 * @returns {Promise<Array>}
 */
async function fetchChecklistForUserAndDate(userId, date) {
  const [rows] = await pool.query(
    `SELECT
       ci.id,
       ci.category_id,
       cc.name AS category,
       cc.display_order AS category_display_order,
       ci.title,
       ci.description,
       ci.display_order,
       ci.is_active,
       COALESCE(dc.completed, 0) AS completed,
       dc.completed_at
     FROM checklist_items ci
     JOIN checklist_categories cc ON cc.id = ci.category_id
     LEFT JOIN daily_checklist dc
       ON dc.checklist_item_id = ci.id
       AND dc.user_id = ?
       AND dc.checklist_date = ?
     WHERE ci.is_active = TRUE
     ORDER BY cc.display_order ASC, ci.display_order ASC, ci.id ASC`,
    [userId, date]
  );

  return rows.map((row) => ({
    id: row.id,
    category_id: row.category_id,
    category: row.category,
    category_display_order: row.category_display_order,
    title: row.title,
    description: row.description,
    display_order: row.display_order,
    completed: Boolean(row.completed),
    completed_at: row.completed_at,
  }));
}

/**
 * GET /api/checklist
 * Retrieves checklist items for a date passed via query string (?date=YYYY-MM-DD),
 * defaulting to today's date.
 */
export async function getChecklist(req, res) {
  try {
    const userId = req.user.id;
    const requestedDate = req.query.date || getTodayDate();

    if (!isValidDate(requestedDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    const items = await fetchChecklistForUserAndDate(userId, requestedDate);

    return res.json({
      success: true,
      date: requestedDate,
      data: items,
    });
  } catch (error) {
    console.error('Error in getChecklist:', error.code || error.name);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve checklist items.',
    });
  }
}

/**
 * GET /api/checklist/:date
 * Retrieves checklist items for a date specified in the route parameter.
 */
export async function getChecklistByDate(req, res) {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    const items = await fetchChecklistForUserAndDate(userId, date);

    return res.json({
      success: true,
      date,
      data: items,
    });
  } catch (error) {
    console.error('Error in getChecklistByDate:', error.code || error.name);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve checklist items for date.',
    });
  }
}

/**
 * PATCH /api/checklist/:itemId
 * Updates an item's completion status for the requested date.
 * Body: { completed: boolean, date: string }
 */
export async function updateChecklistItem(req, res) {
  try {
    const userId = req.user.id;
    const itemId = Number(req.params.itemId);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid checklist item ID. Must be a positive integer.',
      });
    }

    const { completed, date } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'The completed field must be a boolean (true or false).',
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    // Verify checklist item exists and is active
    const [itemRows] = await pool.query(
      'SELECT id, title FROM checklist_items WHERE id = ? AND is_active = TRUE',
      [itemId]
    );

    if (itemRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Checklist item not found.',
      });
    }

    const completedAt = completed ? new Date() : null;

    // Use existing unique constraint uq_daily_checklist_user_item_date
    await pool.query(
      `INSERT INTO daily_checklist (user_id, checklist_item_id, checklist_date, completed, completed_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         completed = VALUES(completed),
         completed_at = VALUES(completed_at),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, itemId, date, completed, completedAt]
    );

    // Synchronize progress table for this user and date
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM checklist_items WHERE is_active = TRUE'
    );
    const [completedRows] = await pool.query(
      `SELECT COUNT(*) AS completed
       FROM daily_checklist dc
       JOIN checklist_items ci ON ci.id = dc.checklist_item_id
       WHERE dc.user_id = ?
         AND dc.checklist_date = ?
         AND dc.completed = 1
         AND ci.is_active = TRUE`,
      [userId, date]
    );

    const totalCount = totalRows[0]?.total || 0;
    const completedCount = completedRows[0]?.completed || 0;
    const percentage = totalCount > 0
      ? Number(((completedCount / totalCount) * 100).toFixed(2))
      : 0.00;

    await pool.query(
      `INSERT INTO progress (user_id, progress_date, completed_count, total_count, percentage)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         completed_count = VALUES(completed_count),
         total_count = VALUES(total_count),
         percentage = VALUES(percentage),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, date, completedCount, totalCount, percentage]
    );

    return res.json({
      success: true,
      message: 'Checklist item updated successfully.',
      data: {
        itemId,
        date,
        completed,
        completed_at: completedAt,
      },
    });
  } catch (error) {
    console.error('Error in updateChecklistItem:', error.code || error.name);
    return res.status(500).json({
      success: false,
      message: 'Failed to update checklist item.',
    });
  }
}
