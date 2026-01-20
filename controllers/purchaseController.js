import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import logActivity from '../utils/logger.js';
import generateNextId from '../utils/sequenceGenerator.js';

// @desc    Create new purchase
// @route   POST /api/purchases
// @access  Private
const createPurchase = async (req, res) => {
    try {
        const { vendor, items, totalAmount, payments } = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ message: 'No items in purchase' });
            return;
        }

        // Calculate Paid & Balance
        const paidAmount = (payments || []).reduce((acc, p) => acc + (p.mode === 'Credit' ? 0 : p.amount), 0);
        const balanceAmount = totalAmount - paidAmount;

        // Determine Status
        let status = 'Unsettled';
        if (balanceAmount === 0) status = 'Fully Settled';
        else if (paidAmount > 0) status = 'Partially Settled';

        const voucherNumber = await generateNextId(req.user.tenantId, 'PURCHASE', 'PUR-');

        const purchase = new Purchase({
            voucherNumber,
            vendor,
            items,
            totalAmount,
            payments,
            paidAmount,
            balanceAmount,
            status,
            tenantId: req.user.tenantId
        });

        await purchase.save();

        // 1. Add Stock & Handle Batches
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                const buyPrice = Number(item.purchasePrice);
                const sellPrice = item.newSellingPrice ? Number(item.newSellingPrice) : product.price;
                const qty = parseInt(item.quantity);

                // Batching Logic: If prices change, create them as a new batch
                // Let's check for an existing batch with the same prices to avoid redundancy
                let batch = (product.batches || []).find(b => b.purchasePrice === buyPrice && b.sellingPrice === sellPrice);

                if (!batch) {
                    const batchNumber = 'BTH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                    if (!product.batches) product.batches = [];
                    product.batches.push({
                        batchNumber,
                        purchasePrice: buyPrice,
                        sellingPrice: sellPrice,
                        stock: qty
                    });
                } else {
                    batch.stock += qty;
                }

                product.stock += qty;
                product.purchasePrice = buyPrice;
                product.price = sellPrice;

                await product.save();
            }
        }

        // 2. Update Vendor Ledger
        const vend = await Vendor.findById(vendor);
        if (vend && balanceAmount > 0) {
            vend.ledgerBalance = (vend.ledgerBalance || 0) + balanceAmount;
            await vend.save();
        }

        logActivity(req.user.tenantId, req.user._id, 'CREATE_PURCHASE', `Created Purchase ${voucherNumber}`, { purchaseId: purchase._id, amount: totalAmount });

        res.status(201).json(purchase);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find({ tenantId: req.user.tenantId })
            .populate('vendor', 'name')
            .sort({ createdAt: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createPurchase, getPurchases };
