import express from 'express';
import { getCollectionReport, getPnLReport } from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/collection', protect, admin, getCollectionReport);
router.get('/pnl', protect, admin, getPnLReport);

export default router;
