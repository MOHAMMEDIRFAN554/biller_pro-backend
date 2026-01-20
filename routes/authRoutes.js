import express from 'express';
import {
    authUser,
    registerAdmin,
    logoutUser,
    getUserProfile,
    getEmployees,
    createEmployee,
    deleteUser
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

router.route('/')
    .get(protect, admin, getEmployees)
    .post(protect, admin, createEmployee);

router.route('/:id')
    .delete(protect, admin, deleteUser);

export default router;
