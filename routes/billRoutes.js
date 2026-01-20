import express from 'express';
import { createBill, getBills, getBillById } from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createBill)
    .get(protect, getBills);

router.route('/:id').get(protect, getBillById);

export default router;
