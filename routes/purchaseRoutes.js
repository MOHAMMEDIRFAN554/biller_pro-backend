import express from 'express';
import { createPurchase, getPurchases } from '../controllers/purchaseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createPurchase)
    .get(protect, getPurchases);

export default router;
