import { Router } from 'express';
import {
  getDailyProgress,
  getWeeklyProgress,
} from '../controllers/progressController.js';

const router = Router();

router.get('/daily', getDailyProgress);
router.get('/weekly', getWeeklyProgress);

export default router;
