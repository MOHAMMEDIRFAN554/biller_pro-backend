import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import logActivity from '../utils/logger.js';
import generateNextId from '../utils/sequenceGenerator.js';

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res) => {
    try {
        const {
            customer,
            items,
            subTotal,
            taxAmount,
            discountAmount,
            grandTotal,
            roundOff,
            payments
        } = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ message: 'No items in bill' });
            return;
        }

        // Pre-deduction Stock Check
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404).json({ message: `Product ${item.name} not found` });
                return;
            }
            if (product.stock < item.quantity) {
                res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
                return;
            }
        }



        // Calculate Paid (Cash/Online)
        let totalPaid = payments.reduce((acc, p) => acc + (p.mode === 'Credit' ? 0 : p.amount), 0);

        let advanceUtilized = 0;
        let cust = null;

        // Handle Advance from Ledger (Negative Balance)
        if (customer) {
            cust = await Customer.findById(customer);
            if (cust && cust.ledgerBalance < 0) {
                const advanceAvailable = Math.abs(cust.ledgerBalance);
                const currentBalanceDue = grandTotal - totalPaid;

                if (currentBalanceDue > 0) {
                    advanceUtilized = Math.min(advanceAvailable, currentBalanceDue);
                    if (advanceUtilized > 0) {
                        payments.push({
                            mode: 'Advance',
                            amount: advanceUtilized,
                            reference: 'From Ledger Credit'
                        });
                        totalPaid += advanceUtilized;
                    }
                }
            }
        }

        // Handle Overpayment Logic
        // overpaymentAction: 'return' (Default) | 'ledger'
        const { overpaymentAction } = req.body;
        let returnedAmount = 0;

        if (totalPaid > grandTotal) {
            const excess = totalPaid - grandTotal;
            if (overpaymentAction === 'ledger' && customer) {
                // Add to Ledger (Credit)
                // returnedAmount remains 0
                // balanceAmount will be negative (handled below)
            } else {
                // Return Cash
                returnedAmount = excess;
            }
        }

        // Effective Paid for Balance Calculation
        // If we returned cash, we don't count it towards "Balance" logic (since it's gone)
        // But we DO count it in "Paid Amount" for record keeping?
        // Actually, paidAmount in DB usually means "Gross Receipt". 
        // We track returnedAmount separately.

        const effectivePaid = totalPaid - returnedAmount;
        const balanceAmount = grandTotal - effectivePaid;

        // Restriction: Only registered customers can have credit (Positive Balance)
        // Negative Balance (Overpayment) is allowed for registered customers (Ledger)
        // But for Walk-in, we must RETURN cash (balanceAmount must be 0)
        if (balanceAmount > 0 && !customer) {
            res.status(400).json({ message: 'Walk-in customers cannot have credit balance. Please select a registered customer.' });
            return;
        }

        // If walk-in overpaid and didn't return? (Should be forced 'return' by frontend, but logic here ensures)
        // If !customer and balanceAmount < 0, it implies we kept the money but have no ledger.
        // We should force returnAmount if !customer.
        if (!customer && balanceAmount < 0) {
            // This case should be covered by line 44 (overpaymentAction default return)
            // But just in case logic falls through:
            // Force return
            const forcedReturn = Math.abs(balanceAmount);
            // effectivePaid -= forcedReturn? No, we need to adjust variables.
            // This is complex to patch. Assuming Logic Block 1 handled it.
            // Logic Block 1 says: if (totalPaid > grandTotal) -> if (!customer) -> returnedAmount = excess.
            // So balanceAmount will be 0. Safe.
        }

        // Determine Status
        let status = 'Unsettled';
        if (balanceAmount <= 0) { // Safety check
            status = 'Fully Settled';
        } else if (totalPaid > 0) {
            status = 'Partially Settled';
        }

        const billNumber = await generateNextId(req.user.tenantId, 'BILL', 'INV-');

        // Distribute Global Discount Pro-Rata
        // Weight = Item.totalAmount / Sum(Item.totalAmount)
        // Allocation = Weight * discountAmount
        let sumItemTotals = items.reduce((acc, item) => acc + item.totalAmount, 0);

        if (discountAmount > 0 && sumItemTotals > 0) {
            let distributedSoFar = 0;
            items.forEach((item, index) => {
                // If last item, take the remainder to avoid rounding issues
                if (index === items.length - 1) {
                    item.proratedBillDiscount = discountAmount - distributedSoFar;
                } else {
                    const ratio = item.totalAmount / sumItemTotals;
                    const share = Math.round((ratio * discountAmount) * 100) / 100; // 2 decimal places
                    item.proratedBillDiscount = share;
                    distributedSoFar += share;
                }
            });
        }

        const bill = new Bill({
            billNumber,
            customer,
            items,
            subTotal,
            taxAmount,
            discountAmount,
            grandTotal,
            roundOff,
            payments,
            paidAmount: totalPaid,
            returnedAmount, // Stored for display
            balanceAmount,
            status,
            tenantId: req.user.tenantId
        });

        const createdBill = await bill.save();

        // 1. Deduct Stock from Batches
        for (let j = 0; j < createdBill.items.length; j++) {
            const item = createdBill.items[j];
            const product = await Product.findById(item.product);
            if (product && product.batches && product.batches.length > 0) {
                let remainingToDeduct = item.quantity;

                for (let i = 0; i < product.batches.length; i++) {
                    if (remainingToDeduct <= 0) break;

                    let b = product.batches[i];
                    if (b.stock > 0) {
                        const deduct = Math.min(b.stock, remainingToDeduct);
                        b.stock -= deduct;
                        remainingToDeduct -= deduct;

                        // Set the batch number for the return reference (uses the first batch it hits)
                        if (!item.batchNumber) {
                            item.batchNumber = b.batchNumber;
                        }
                    }
                }

                // Delete old batches if stock becomes 0
                product.batches = product.batches.filter(b => b.stock > 0);
                product.stock -= item.quantity;
                await product.save();
            } else if (product) {
                // Fallback if no batches exist
                product.stock -= item.quantity;
                await product.save();
            }
        }
        await createdBill.save(); // Update items with batchNumbers

        // 2. Update Customer Ledger
        // Logic: Add the Total Bill value (Credit taken) EXCEPT the part paid by Cash/Online.
        // Or simply: Add balanceAmount (Unpaid) + advanceUtilized (Consumed Credit)
        // balanceAmount can be Negative (Credit to customer) if overpaid and action=ledger
        if (cust && (balanceAmount !== 0 || advanceUtilized > 0)) {
            // cust is already fetched above
            cust.ledgerBalance += (balanceAmount + advanceUtilized);
            await cust.save();
        }

        logActivity(req.user.tenantId, req.user._id, 'CREATE_BILL', `Created Bill ${billNumber}`, { billId: createdBill._id, amount: grandTotal });

        res.status(201).json(createdBill);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
    try {
        const { page = 1, limit = 20, keyword } = req.query;
        const tenantId = req.user.tenantId;

        let query = { tenantId };

        if (keyword) {
            // Find customers matching name to include in search
            const customers = await Customer.find({
                tenantId,
                name: { $regex: keyword, $options: 'i' }
            }).select('_id');

            const customerIds = customers.map(c => c._id);

            query.$or = [
                { billNumber: { $regex: keyword, $options: 'i' } },
                { customer: { $in: customerIds } } // Bills for these customers
            ];
        }

        const count = await Bill.countDocuments(query);
        const bills = await Bill.find(query)
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(limit) * (Number(page) - 1));

        res.json({
            bills,
            page: Number(page),
            pages: Math.ceil(count / Number(limit)),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBillById = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate('customer', 'name phone address email ledgerBalance')
            .populate('items.product', 'name barcode');

        if (!bill || bill.tenantId !== req.user.tenantId) {
            res.status(404).json({ message: 'Bill not found' });
            return;
        }
        res.json(bill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createBill, getBills, getBillById };
