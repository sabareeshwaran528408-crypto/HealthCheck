import pool from '../config/db.js';

const CATEGORY_ALIASES = {
  'physical activity': 'Exercise',
  exercise: 'Exercise',
  'mental wellbeing': 'Mental Wellbeing',
  'study habits': 'Study & Focus',
  'study & focus': 'Study & Focus',
  'skin care': 'Healthy Skin',
  'healthy skin': 'Healthy Skin',
  'hair care': 'Hair & Scalp Care',
  'hair & scalp care': 'Hair & Scalp Care',
  sleep: 'Sleep',
  nutrition: 'Nutrition',
  hydration: 'Hydration',
};

/**
 * Shared query to retrieve active recommendations, optionally filtered by category.
 * @param {string|null} categoryFilter
 * @returns {Promise<Array>}
 */
async function fetchRecommendations(categoryFilter) {
  if (categoryFilter && categoryFilter.toLowerCase() !== 'all') {
    const trimmed = categoryFilter.trim();
    const resolvedCategory = CATEGORY_ALIASES[trimmed.toLowerCase()] || trimmed;

    const [rows] = await pool.query(
      `SELECT id, category, title, content, display_order, is_active
       FROM recommendations
       WHERE is_active = TRUE AND LOWER(category) = LOWER(?)
       ORDER BY display_order ASC, id ASC`,
      [resolvedCategory]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `SELECT id, category, title, content, display_order, is_active
     FROM recommendations
     WHERE is_active = TRUE
     ORDER BY display_order ASC, id ASC`
  );
  return rows;
}

/**
 * GET /api/recommendations
 * Supports ?category=... query parameter or returns all active recommendations.
 */
export async function getRecommendations(req, res) {
  try {
    const category = req.query.category || null;
    const rows = await fetchRecommendations(category);

    const data = rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      content: r.content,
      display_order: r.display_order,
    }));

    return res.json({
      success: true,
      category: category || 'All',
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error in getRecommendations:', error.code || error.name);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recommendations.',
    });
  }
}

/**
 * GET /api/recommendations/:category
 * Returns recommendations filtered by route parameter.
 */
export async function getRecommendationsByCategory(req, res) {
  try {
    const { category } = req.params;
    const rows = await fetchRecommendations(category);

    const data = rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      content: r.content,
      display_order: r.display_order,
    }));

    return res.json({
      success: true,
      category,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error in getRecommendationsByCategory:', error.code || error.name);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recommendations for category.',
    });
  }
}
