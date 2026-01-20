import express from 'express';
import {
    getSequences,
    updateSequencePrefix,
    getAuditLogs,
    getCompanyProfile,
    updateCompanyProfile
} from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sequences', protect, admin, getSequences);
router.put('/sequences', protect, admin, updateSequencePrefix);
router.get('/logs', protect, admin, getAuditLogs);

// Company Profile
router.get('/profile', protect, getCompanyProfile);
router.put('/profile', protect, admin, updateCompanyProfile);

export default router;
