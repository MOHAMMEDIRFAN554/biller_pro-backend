import Vendor from '../models/Vendor.js';

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({ tenantId: req.user.tenantId });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res) => {
    try {
        const { name, address, openingBalance } = req.body;

        const vendor = new Vendor({
            name,
            address,
            openingBalance,
            ledgerBalance: openingBalance || 0,
            tenantId: req.user.tenantId
        });

        const createdVendor = await vendor.save();
        res.status(201).json(createdVendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getVendors, createVendor };
