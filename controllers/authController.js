import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import logActivity from '../utils/logger.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        generateToken(res, user._id, user.tenantId);

        // Log Login
        logActivity(user.tenantId, user._id, 'LOGIN', `${user.name} logged in`);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new tenant & admin
// @route   POST /api/users/register
// @access  Public
const registerAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    // Generate a new Tenant ID (Simple UUID or Random String)
    const tenantId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const user = await User.create({
        name,
        email,
        password,
        role: 'admin',
        tenantId
    });

    if (user) {
        generateToken(res, user._id, user.tenantId);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: 'None'
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all employees for tenant
// @route   GET /api/users
// @access  Private/Admin
const getEmployees = async (req, res) => {
    try {
        const users = await User.find({ tenantId: req.user.tenantId }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new employee
// @route   POST /api/users
// @access  Private/Admin
const createEmployee = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'employee', // Default to employee
            tenantId: req.user.tenantId
        });

        if (user) {
            logActivity(req.user.tenantId, req.user._id, 'CREATE_USER', `Created user ${user.name} (${user.role})`);

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

        if (user) {
            if (user._id.toString() === req.user._id.toString()) {
                res.status(400).json({ message: 'Cannot delete self' });
                return;
            }
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    authUser,
    registerAdmin,
    logoutUser,
    getUserProfile,
    getEmployees,
    createEmployee,
    deleteUser
};
