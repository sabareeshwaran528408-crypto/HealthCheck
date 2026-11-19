import pool from '../config/db.js';
import { isValidDate, getTodayDate, shiftDate } from '../utils/date.js';

/**
 * GET /api/progress/daily
 * Calculates daily progress for a user on a given date (?date=YYYY-MM-DD).
 */
export function createDailyProgressHandler(database = pool) {
  return async function getDailyProgress(req, res) {
    try {
    const userId = req.user.id;
    const date = req.query.date || getTodayDate();

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    const [totalRows] = await database.query(
      'SELECT COUNT(*) AS total FROM checklist_items WHERE is_active = TRUE'
    );
    const [completedRows] = await database.query(
      `SELECT COUNT(*) AS completed
       FROM daily_checklist dc
       JOIN checklist_items ci ON ci.id = dc.checklist_item_id
       WHERE dc.user_id = ?
         AND dc.checklist_date = ?
         AND dc.completed = 1
         AND ci.is_active = TRUE`,
      [userId, date]
    );

    const total = totalRows[0]?.total || 0;
    const completed = completedRows[0]?.completed || 0;
    const percentage = total > 0
      ? Number(((completed / total) * 100).toFixed(2))
      : 0.00;

      return res.json({
        success: true,
        data: {
          date,
          completed,
          total,
          pending: Math.max(0, total - completed),
          percentage: Math.round(percentage),
        },
      });
    } catch (error) {
      console.error('Error in getDailyProgress:', error.code || error.name);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve daily progress.',
      });
    }
  };
}

export const getDailyProgress = createDailyProgressHandler();

/**
 * GET /api/progress/weekly
 * Returns daily totals and percentages for each date in a 7-day range.
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function getWeeklyProgress(req, res) {
  try {
    const userId = req.user.id;
    let { startDate, endDate } = req.query;

    if (!startDate && !endDate) {
      endDate = getTodayDate();
      startDate = shiftDate(endDate, -6);
    } else if (startDate && !endDate) {
      endDate = shiftDate(startDate, 6);
    } else if (!startDate && endDate) {
      startDate = shiftDate(endDate, -6);
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range format. Expected YYYY-MM-DD.',
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be on or before endDate.',
      });
    }

    const [totalRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM checklist_items WHERE is_active = TRUE'
    );
    const total = totalRows[0]?.total || 0;

    const [completionRows] = await pool.query(
      `SELECT
         DATE_FORMAT(dc.checklist_date, '%Y-%m-%d') AS date,
         COUNT(*) AS completed
       FROM daily_checklist dc
       JOIN checklist_items ci ON ci.id = dc.checklist_item_id
       WHERE dc.user_id = ?
         AND dc.checklist_date BETWEEN ? AND ?
         AND dc.completed = 1
         AND ci.is_active = TRUE
       GROUP BY dc.checklist_date
       ORDER BY dc.checklist_date ASC`,
      [userId, startDate, endDate]
    );

    const completionMap = new Map();
    for (const row of completionRows) {
      completionMap.set(row.date, row.completed);
    }

    // Build consecutive days between startDate and endDate
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const completed = completionMap.get(currentDate) || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const [y, m, d] = currentDate.split('-').map(Number);
      const utcDate = new Date(Date.UTC(y, m - 1, d));
      const dayName = dayNames[utcDate.getUTCDay()];

      days.push({
        date: currentDate,
        day: dayName,
        completed,
        total,
        percentage,
      });

      currentDate = shiftDate(currentDate, 1);
    }

    const totalPercentages = days.reduce((acc, curr) => acc + curr.percentage, 0);
    const averagePercentage = days.length > 0 ? Math.round(totalPercentages / days.length) : 0;

    return res.json({
      success: true,
      data: {
        startDate,
        endDate,
        days,
        averagePercentage,
        totalActiveItems: total,
      },
    });
  } catch (error) {
    console.error('Error in getWeeklyProgress:', error.code || error.name);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve weekly progress.',
    });
  }
}
