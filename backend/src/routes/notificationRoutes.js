import { Router } from 'express';
import {
  getPreferences,
  updatePreferences,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;

