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

        // 5. Graph Data (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dailySales = await Bill.aggregate([
            { $match: { tenantId, createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$grandTotal" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            totalSales: salesStats[0]?.totalSales || 0,
            totalOrders: salesStats[0]?.count || 0,
            totalExpenses: expenseStats[0]?.totalExpenses || 0,
            customerCount,
            productCount,
            lowStockProducts,
            recentBills,
            dailySales
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getDashboardStats };
