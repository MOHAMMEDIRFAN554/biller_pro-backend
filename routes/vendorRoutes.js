import express from 'express';
import { getVendors, createVendor } from '../controllers/vendorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getVendors)
    .post(protect, createVendor);

export default router;
