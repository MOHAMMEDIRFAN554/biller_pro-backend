import express from 'express';
import { getCustomers, createCustomer, getCustomerTransactions, getCustomerById } from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getCustomers)
    .post(protect, createCustomer);

router.route('/:id').get(protect, getCustomerById);
router.route('/:id/transactions').get(protect, getCustomerTransactions);

export default router;
