import { Router } from 'express';
import {
  getChecklist,
  getChecklistByDate,
  updateChecklistItem,
} from '../controllers/checklistController.js';

const router = Router();

router.get('/', getChecklist);
router.get('/:date', getChecklistByDate);
router.patch('/:itemId', updateChecklistItem);

export default router;
