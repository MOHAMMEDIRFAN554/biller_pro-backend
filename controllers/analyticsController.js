import Bill from '../models/Bill.js';
import Expense from '../models/Expense.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        // 1. Financial Totals (Aggregate for speed)
        const salesStats = await Bill.aggregate([
            { $match: { tenantId } },
            { $group: { _id: null, totalSales: { $sum: "$grandTotal" }, count: { $sum: 1 } } }
        ]);

        const expenseStats = await Expense.aggregate([
            { $match: { tenantId } },
            { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
        ]);

        // 2. Counts
        const customerCount = await Customer.countDocuments({ tenantId });
        const productCount = await Product.countDocuments({ tenantId });

        // 3. Low Stock 
        const lowStockProducts = await Product.find({ tenantId, stock: { $lte: 10 } })
            .select('name stock price')
            .limit(5);

        // 4. Recent Transactions
        const recentBills = await Bill.find({ tenantId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'name');

        res.json({
            totalSales: salesStats[0]?.totalSales || 0,
            totalOrders: salesStats[0]?.count || 0,
            totalExpenses: expenseStats[0]?.totalExpenses || 0,
            customerCount,
            productCount,
            lowStockProducts,
            recentBills
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getDashboardStats };
