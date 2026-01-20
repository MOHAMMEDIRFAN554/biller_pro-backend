import Customer from '../models/Customer.js';
import Bill from '../models/Bill.js';
import SalesReturn from '../models/SalesReturn.js';
import LedgerPayment from '../models/LedgerPayment.js';

// @desc    Fetch all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;
        const keyword = req.query.keyword
            ? {
                $or: [
                    { name: { $regex: req.query.keyword, $options: 'i' } },
                    { phone: { $regex: req.query.keyword, $options: 'i' } }
                ]
            }
            : {};

        const query = { ...keyword, tenantId: req.user.tenantId };

        const count = await Customer.countDocuments(query);
        const customers = await Customer.find(query)
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ customers, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        const customerExists = await Customer.findOne({ phone, tenantId: req.user.tenantId });

        if (customerExists) {
            res.status(400).json({ message: 'Customer with this phone already exists' });
            return;
        }

        const customer = new Customer({
            name: name.toUpperCase(),
            phone,
            email: email ? email.toUpperCase() : '',
            address: address ? address.toUpperCase() : '',
            tenantId: req.user.tenantId
        });

        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer transactions (Ledger)
// @route   GET /api/customers/:id/transactions
// @access  Private
const getCustomerTransactions = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }

        const bills = await Bill.find({ customer: id, tenantId, ...dateFilter });
        const returns = await SalesReturn.find({ customer: id, tenantId, ...dateFilter });
        const payments = await LedgerPayment.find({ partyId: id, tenantId, ...dateFilter });

        // Normalize data for consistent table display
        const transactions = [
            ...bills.map(b => ({
                date: b.createdAt,
                type: 'SALE',
                id: b.billNumber,
                refId: b._id,
                amount: b.grandTotal,
                status: b.status
            })),
            ...returns.map(r => ({
                date: r.createdAt,
                type: 'RETURN',
                id: 'RET-' + String(r._id).slice(-5).toUpperCase(),
                refId: r._id,
                amount: r.totalRefundAmount,
                status: r.refundMode
            })),
            ...payments.map(p => ({
                date: p.createdAt,
                type: 'PAYMENT',
                id: p.paymentNumber,
                refId: p._id,
                amount: p.totalPaid,
                status: p.payments.map(py => py.mode).join(', ')
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getCustomers, createCustomer, getCustomerTransactions, getCustomerById };
