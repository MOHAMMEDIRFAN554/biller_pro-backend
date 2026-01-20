import express from 'express';
import { createSalesReturn, createPurchaseReturn, getSalesReturn } from '../controllers/returnController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sales', protect, createSalesReturn);
router.get('/sales/:id', protect, getSalesReturn);
router.post('/purchase', protect, createPurchaseReturn);

export default router;
