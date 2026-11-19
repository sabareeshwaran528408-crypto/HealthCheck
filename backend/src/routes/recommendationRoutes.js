import { Router } from 'express';
import {
  getRecommendations,
  getRecommendationsByCategory,
} from '../controllers/recommendationController.js';

const router = Router();

router.get('/', getRecommendations);
router.get('/:category', getRecommendationsByCategory);

export default router;
