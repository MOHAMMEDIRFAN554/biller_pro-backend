import SalesReturn from '../models/SalesReturn.js';
import PurchaseReturn from '../models/PurchaseReturn.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Vendor from '../models/Vendor.js';
import Bill from '../models/Bill.js';
import Purchase from '../models/Purchase.js';

// @desc    Create Sales Return
// @route   POST /api/returns/sales
// @access  Private
const createSalesReturn = async (req, res) => {
    try {
        const { billId, items, reason } = req.body; // items: [{ productId, quantity }]

        const bill = await Bill.findById(billId);
        if (!bill) {
            res.status(404).json({ message: 'Bill not found' });
            return;
        }

        let totalRefund = 0;
        const returnItems = [];

        for (const item of items) {
            // Find original price from bill items
            const billItem = bill.items.find(i => i.product.toString() === item.productId);

            if (!billItem) continue; // Skip if not in original bill (security check)

            const qtyToReturn = parseInt(item.quantity);
            const refundAmount = billItem.price * qtyToReturn; // Simple logic: Return Selling Price
            totalRefund += refundAmount;

            // Update Returned Quantity in Bill
            billItem.returnedQuantity = (billItem.returnedQuantity || 0) + qtyToReturn;
            billItem.totalAmount -= refundAmount;

            returnItems.push({
                product: item.productId,
                quantity: qtyToReturn,
                refundAmount
            });

            // 1. Restore Stock to Batch
            const product = await Product.findById(item.productId);
            if (product) {
                // Recreate or add to existing batch
                let batch = (product.batches || []).find(b => b.batchNumber === billItem.batchNumber);
                if (batch) {
                    batch.stock += qtyToReturn;
                } else {
                    // Recreate batch if it was deleted
                    if (!product.batches) product.batches = [];
                    product.batches.push({
                        batchNumber: billItem.batchNumber || 'BTH-RET-' + Math.random().toString(36).substring(2, 5),
                        purchasePrice: product.purchasePrice || 0,
                        sellingPrice: billItem.price,
                        stock: qtyToReturn
                    });
                }
                product.stock += qtyToReturn;
                await product.save();
            }
        }

        // Adjust Bill Financials
        bill.grandTotal -= totalRefund;
        if (bill.balanceAmount > 0) {
            const balanceReduction = Math.min(bill.balanceAmount, totalRefund);
            bill.balanceAmount -= balanceReduction;

            // If ledger was used, we also need to adjust customer's balance later
            // But if we reduced balanceAmount, then the "debt" is already reduced.
        }

        // Update Status
        if (bill.balanceAmount === 0) bill.status = 'Fully Settled';
        else if (bill.balanceAmount < bill.grandTotal) bill.status = 'Partially Settled';

        await bill.save();

        const salesReturn = new SalesReturn({
            originalBill: billId,
            customer: bill.customer,
            items: returnItems,
            totalRefundAmount: totalRefund,
            refundMode: req.body.refundMode || 'Ledger',
            refundReference: req.body.refundReference,
            reason,
            tenantId: req.user.tenantId
        });

        await salesReturn.save();

        // 2. Adjust Ledger ONLY if mode is Ledger
        if (bill.customer && (req.body.refundMode === 'Ledger' || !req.body.refundMode)) {
            const customer = await Customer.findById(bill.customer);
            if (customer) {
                // If the bill still had a balance, it's already deducted from bill.balanceAmount
                // We should only subtract what's "actually" being refunded to their ledger balance.
                customer.ledgerBalance -= totalRefund;
                await customer.save();
            }
        }

        res.status(201).json(salesReturn);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Purchase Return
// @route   POST /api/returns/purchase
// @access  Private
const createPurchaseReturn = async (req, res) => {
    try {
        const { purchaseId, items, reason } = req.body;

        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            res.status(404).json({ message: 'Purchase Voucher not found' });
            return;
        }

        let totalRefund = 0;
        const returnItems = [];

        for (const item of items) {
            const purchaseItem = purchase.items.find(i => i.product.toString() === item.productId);
            if (!purchaseItem) continue;

            const refundAmount = purchaseItem.purchasePrice * item.quantity;
            totalRefund += refundAmount;

            returnItems.push({
                product: item.productId,
                quantity: item.quantity,
                refundAmount
            });

            // 1. Reduce Stock
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock -= parseInt(item.quantity);
                await product.save();
            }
        }

        const purchaseReturn = new PurchaseReturn({
            originalPurchase: purchaseId,
            vendor: purchase.vendor,
            items: returnItems,
            totalRefundAmount: totalRefund,
            reason,
            tenantId: req.user.tenantId
        });

        await purchaseReturn.save();

        // 2. Adjust Ledger (Debit the vendor)
        if (purchase.vendor) {
            const vendor = await Vendor.findById(purchase.vendor);
            // If we returned goods, we owe them less.
            // Ledger Balance: +ve means we owe them. So we SUBTRACT.
            if (vendor) {
                vendor.ledgerBalance -= totalRefund;
                await vendor.save();
            }
        }

        res.status(201).json(purchaseReturn);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSalesReturn = async (req, res) => {
    try {
        const salesReturn = await SalesReturn.findById(req.params.id)
            .populate('customer', 'name phone address')
            .populate('items.product', 'name');

        if (!salesReturn) {
            res.status(404).json({ message: 'Return not found' });
            return;
        }

        res.json(salesReturn);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSalesReturns = async (req, res) => {
    try {
        const returns = await SalesReturn.find({ tenantId: req.user.tenantId })
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 });
        res.json(returns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createSalesReturn, createPurchaseReturn, getSalesReturn, getSalesReturns };
