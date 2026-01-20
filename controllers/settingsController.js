import Sequence from '../models/Sequence.js';
import AuditLog from '../models/AuditLog.js';
import CompanyProfile from '../models/CompanyProfile.js';

// @desc    Get all sequences/prefixes
// @route   GET /api/settings/sequences
// @access  Private/Admin
const getSequences = async (req, res) => {
    try {
        const sequences = await Sequence.find({ tenantId: req.user.tenantId });
        res.json(sequences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update sequence prefix
// @route   PUT /api/settings/sequences
// @access  Private/Admin
const updateSequencePrefix = async (req, res) => {
    try {
        const { type, prefix } = req.body;

        const sequence = await Sequence.findOneAndUpdate(
            { tenantId: req.user.tenantId, type },
            { $set: { prefix } },
            { new: true, upsert: true }
        );

        res.json(sequence);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get audit logs
// @route   GET /api/settings/logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({ tenantId: req.user.tenantId })
            .populate('user', 'name role')
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 for now
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get company profile
// @route   GET /api/settings/profile
// @access  Private
const getCompanyProfile = async (req, res) => {
    try {
        let profile = await CompanyProfile.findOne({ tenantId: req.user.tenantId });

        if (!profile) {
            // Create a default one if it doesn't exist
            profile = await CompanyProfile.create({
                tenantId: req.user.tenantId,
                name: 'My Business',
                address: 'Set your address in settings'
            });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update company profile
// @route   PUT /api/settings/profile
// @access  Private/Admin
const updateCompanyProfile = async (req, res) => {
    try {
        const { name, address, phone, email, website } = req.body;

        const profile = await CompanyProfile.findOneAndUpdate(
            { tenantId: req.user.tenantId },
            { $set: { name, address, phone, email, website } },
            { new: true, upsert: true }
        );

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getSequences,
    updateSequencePrefix,
    getAuditLogs,
    getCompanyProfile,
    updateCompanyProfile
};
