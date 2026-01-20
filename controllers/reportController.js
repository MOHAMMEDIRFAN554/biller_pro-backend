import Bill from '../models/Bill.js';
import SalesReturn from '../models/SalesReturn.js';
import LedgerPayment from '../models/LedgerPayment.js';
import Purchase from '../models/Purchase.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import Expense from '../models/Expense.js';
import Product from '../models/Product.js';

// @desc    Get collection report by date range
// @route   GET /api/reports/collection
// @access  Private/Admin
const getCollectionReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const tenantId = req.user.tenantId;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
            tenantId,
            createdAt: { $gte: start, $lte: end }
        }).populate('customer', 'name phone');

        const returns = await SalesReturn.find({
            tenantId,
            createdAt: { $gte: start, $lte: end }
        }).populate('customer', 'name phone');

        const ledgerPayments = await LedgerPayment.find({
            tenantId,
            partyType: 'Customer',
            createdAt: { $gte: start, $lte: end }
        }).populate('partyId', 'name phone');

        // Aggregation
        let totalCash = 0;
        let totalUPI = 0;
        let totalCard = 0;
        let totalCredit = 0;
        let totalDiscount = 0;
        let totalSaleAmount = 0;
        let totalReturnAmount = 0;

        bills.forEach(bill => {
            totalSaleAmount += bill.grandTotal;
            totalDiscount += bill.totalDiscount || 0;

            bill.payments.forEach(p => {
                if (p.mode === 'Cash') totalCash += p.amount;
                if (p.mode === 'UPI') totalUPI += p.amount;
                if (p.mode === 'Card') totalCard += p.amount;
            });

            // Credit sales are handled via ledger updates in controller, 
            // but for report, we calculate the remaining balance as "Credit"
            // Fix: Use current logic balance (which updates on payment receipts)
            totalCredit += bill.balanceAmount;
        });

        // Add ledger payments (collection from outstanding)
        ledgerPayments.forEach(lp => {
            lp.payments.forEach(p => {
                if (p.mode === 'Cash') totalCash += p.amount;
                if (p.mode === 'UPI') totalUPI += p.amount;
                if (p.mode === 'Card') totalCard += p.amount;
            });
        });

        returns.forEach(ret => {
            totalReturnAmount += ret.totalRefundAmount;
            if (ret.refundMode === 'Cash') totalCash -= ret.totalRefundAmount;
            if (ret.refundMode === 'UPI') totalUPI -= ret.totalRefundAmount;
            if (ret.refundMode === 'Card') totalCard -= ret.totalRefundAmount;
        });

        res.json({
            summary: {
                totalSaleAmount,
                totalReturnAmount,
                totalDiscount,
                totalCash,
                totalUPI,
                totalCard,
                totalCredit, // Unpaid/Outstanding Amount
                netCollection: totalCash + totalUPI + totalCard
            },
            details: {
                bills,
                returns,
                ledgerPayments
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPnLReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const tenantId = req.user.tenantId;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Fetch Data
        const bills = await Bill.find({ tenantId, createdAt: { $gte: start, $lte: end } });
        const salesReturns = await SalesReturn.find({ tenantId, createdAt: { $gte: start, $lte: end } });
        const expenses = await Expense.find({ tenantId, createdAt: { $gte: start, $lte: end } });
        const purchases = await Purchase.find({ tenantId, createdAt: { $gte: start, $lte: end } });
        const purchaseReturns = await PurchaseReturn.find({ tenantId, createdAt: { $gte: start, $lte: end } });

        // Fetch Products for Purchase Price (Cost)
        // Optimization: Fetch only needed products or all (if list is small)
        // For accuracy, we should check batch history, but using current master Purchase Price is requested/implied
        const products = await Product.find({ tenantId }).select('_id purchasePrice');
        const productCostMap = {};
        products.forEach(p => {
            productCostMap[p._id.toString()] = p.purchasePrice;
        });

        // 1. Calculate Sales, Costs, and Item-Level Profits
        let totalSales = 0; // Grand Total (Revenue)
        let totalCost = 0; // Cost of Goods Sold based on Product Master
        let totalTaxCollected = 0;
        let totalBillDiscounts = 0;

        // User Defined Metrics
        let userNetProfitCalc = 0; // Sale - Purchase - Discount
        let userGrossProfitCalc = 0; // Sale - Purchase - Discount - Tax

        bills.forEach(bill => {
            totalSales += bill.grandTotal;
            totalBillDiscounts += (bill.discountAmount || 0);

            let billProratedSum = 0;

            // Item Level Calculation
            bill.items.forEach(item => {
                const qty = item.quantity;
                const salePrice = item.price * qty;
                const lineTotal = item.totalAmount;
                const purchaseRate = productCostMap[item.product.toString()] || 0;
                const cost = purchaseRate * qty;

                // Back-calculate Tax from lineTotal
                // effectiveSale is the actual collected amount (after prorated discount)
                // Tax is part of this effectiveSale
                const prorated = item.proratedBillDiscount || 0;
                billProratedSum += prorated;

                const effectiveSale = lineTotal - prorated;

                // Output Tax (Tax collected on Sale)
                const outputTax = effectiveSale - (effectiveSale / (1 + (item.gstRate / 100)));

                // Input Tax (Tax paid on Purchase)
                // Assumption: Purchase Price (cost) is Inclusive of Tax, and GST Rate is same
                const inputTax = cost - (cost / (1 + (item.gstRate / 100)));

                const baseSale = effectiveSale - outputTax;
                const baseCost = cost - inputTax;

                totalTaxCollected += outputTax;
                // totalCost is Inventory Value (Purchase Price). Keep as In-Store Value.
                totalCost += cost;

                // User Formulas (Marginal Tax Logic: Profit = BaseSale - BaseCost)
                userNetProfitCalc += (baseSale - baseCost);
                userGrossProfitCalc += (baseSale - baseCost);
            });

            // Adjust for Bill Level Discount (Backward Compatibility)
            // If items didn't have prorated discount (old bills), billProratedSum will be 0.
            // In that case, we subtract the bulk discountAmount.
            // Also handles rounding differences if any.
            // Logic: The amount NOT distributed is the remaining amount to subtract.

            const totalBillDiscount = bill.discountAmount || 0;
            const remainingUndistributed = totalBillDiscount - billProratedSum;

            if (remainingUndistributed > 0.1) { // Threshold for float precision
                userNetProfitCalc -= remainingUndistributed;
                userGrossProfitCalc -= remainingUndistributed;
            }
        });

        // 2. Returns Adjustment
        let totalSalesReturns = 0;
        let totalReturnCost = 0;

        salesReturns.forEach(ret => {
            totalSalesReturns += ret.totalRefundAmount;

            // Calculate Cost of Returned Goods (Asset Recovery)
            let currentReturnCost = 0;
            if (ret.items) {
                ret.items.forEach(item => {
                    const pid = item.product ? item.product.toString() : null;
                    if (pid && productCostMap[pid]) {
                        currentReturnCost += (productCostMap[pid] * item.quantity);
                    }
                });
            }
            totalReturnCost += currentReturnCost;

            // Adjust Profits
            // Profit = Sale - Cost.
            // On Return: Reverse Sale (Subtract Refund), Reverse Cost (Add back Stocks Value)
            userNetProfitCalc -= ret.totalRefundAmount;
            userNetProfitCalc += currentReturnCost;

            userGrossProfitCalc -= ret.totalRefundAmount;
            userGrossProfitCalc += currentReturnCost;
        });

        const netRevenue = totalSales - totalSalesReturns;
        const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

        // 3. Purchase Analysis (Cash Flow / Inventory Addition)
        const totalPurchaseValue = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
        const totalPurchaseReturnValue = purchaseReturns.reduce((acc, p) => acc + p.totalRefundAmount, 0);
        const netPurchaseOutflow = totalPurchaseValue - totalPurchaseReturnValue;

        // Final PnL
        // User "Gross Profit" is essentially Trading Profit (Pre-Tax, Post-Discount)
        // User "Net Profit" (User defined) is Trading Profit + Tax? (Weird naming)

        // Let's standardize for the response:
        // "Gross Profit" -> userGrossProfitCalc (Real Trading Margin)
        // "Net Profit" -> userGrossProfitCalc - Expenses (True Bottom Line)

        const finalNetProfit = userGrossProfitCalc - totalExpenses;

        res.json({
            revenue: { totalSales, totalSalesReturns, netRevenue },
            cogs: {
                totalCost,
                returnCost: totalReturnCost,
                netPurchases: totalCost - totalReturnCost,
                actualPurchaseOutflow: netPurchaseOutflow
            },
            expenses: { totalExpenses },
            profit: {
                userNetProfit: userNetProfitCalc, // As per User Formula (Inc Tax)
                userGrossProfit: userGrossProfitCalc, // As per User Formula (Excl Tax)
                grossProfit: userGrossProfitCalc, // Standard mapping
                netProfit: finalNetProfit // Final PnL after expenses
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getCollectionReport, getPnLReport };
