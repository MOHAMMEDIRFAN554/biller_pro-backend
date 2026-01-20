import express from 'express';
import { createLedgerPayment, getLedgerPayments, getLedgerPaymentById } from '../controllers/ledgerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/payments', protect, createLedgerPayment);
router.get('/payments', protect, getLedgerPayments);
router.get('/payments/:id', protect, getLedgerPaymentById);

export default router;
