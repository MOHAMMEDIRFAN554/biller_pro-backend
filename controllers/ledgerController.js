import LedgerPayment from '../models/LedgerPayment.js';
import Customer from '../models/Customer.js';
import Vendor from '../models/Vendor.js';
import generateNextId from '../utils/sequenceGenerator.js';
import logActivity from '../utils/logger.js';

import Bill from '../models/Bill.js';
import Purchase from '../models/Purchase.js';

// @desc    Collect payment from customer (or pay vendor)
// @route   POST /api/ledger/payments
// @access  Private
const createLedgerPayment = async (req, res) => {
    try {
        const { partyId, partyType, amount, totalPaid, payments, note, discount } = req.body;

        if (!partyId || !amount || !payments) {
            res.status(400).json({ message: 'Missing payment details' });
            return;
        }

        const sequenceType = partyType === 'Customer' ? 'RECEIPT' : 'PAYMENT';
        const prefix = partyType === 'Customer' ? 'RCT-' : 'VPAY-';
        const paymentNumber = await generateNextId(req.user.tenantId, sequenceType, prefix);

        const finalDiscount = Number(discount) || 0;
        const finalTotalPaid = Number(totalPaid);

        const ledgerPayment = new LedgerPayment({
            tenantId: req.user.tenantId,
            partyId,
            partyType,
            paymentNumber,
            amount,
            totalPaid: finalTotalPaid,
            discount: finalDiscount,
            payments,
            note
        });

        await ledgerPayment.save();

        if (partyType === 'Customer') {
            const customer = await Customer.findById(partyId);
            if (customer) {
                customer.ledgerBalance -= (finalTotalPaid + finalDiscount);
                await customer.save();
            }

            // FIFO Bill Settlement Logic
            let remainingPayment = finalTotalPaid + finalDiscount;

            // Find unsettled bills sorted by date (oldest first)
            const pendingBills = await Bill.find({
                customer: partyId,
                status: { $in: ['Unsettled', 'Partially Settled'] },
                tenantId: req.user.tenantId
            }).sort({ createdAt: 1 });

            for (const bill of pendingBills) {
                if (remainingPayment <= 0) break;

                const billDue = bill.grandTotal - bill.paidAmount;
                if (billDue <= 0) continue; // Should not happen based on query, but safety check

                const paymentForBill = Math.min(billDue, remainingPayment);

                bill.paidAmount += paymentForBill;
                bill.balanceAmount = bill.grandTotal - bill.paidAmount;
                remainingPayment -= paymentForBill;

                // Update Status
                if (bill.balanceAmount <= 0) {
                    bill.status = 'Fully Settled';
                    bill.balanceAmount = 0; // Floating point safety
                } else {
                    bill.status = 'Partially Settled';
                }

                await bill.save();
            }

        } else if (partyType === 'Vendor') {
            const vendor = await Vendor.findById(partyId);
            if (vendor) {
                vendor.ledgerBalance -= (finalTotalPaid + finalDiscount);
                await vendor.save();
            }

            // FIFO Purchase Settlement Logic
            let remainingPayment = finalTotalPaid + finalDiscount;

            const pendingPurchases = await Purchase.find({
                vendor: partyId,
                status: { $in: ['Unsettled', 'Partially Settled'] },
                tenantId: req.user.tenantId
            }).sort({ createdAt: 1 });

            for (const purchase of pendingPurchases) {
                if (remainingPayment <= 0) break;

                const purchaseDue = purchase.totalAmount - purchase.paidAmount;
                if (purchaseDue <= 0) continue;

                const paymentForPurchase = Math.min(purchaseDue, remainingPayment);

                purchase.paidAmount += paymentForPurchase;
                purchase.balanceAmount = purchase.totalAmount - purchase.paidAmount;
                remainingPayment -= paymentForPurchase;

                // Update Status
                if (purchase.balanceAmount <= 0) {
                    purchase.status = 'Fully Settled';
                    purchase.balanceAmount = 0;
                } else {
                    purchase.status = 'Partially Settled';
                }

                await purchase.save();
            }
        }

        logActivity(req.user.tenantId, req.user._id, 'LEDGER_PAYMENT', `New ${partyType} Payment ${paymentNumber}`, { amount: totalPaid });
        res.status(201).json(ledgerPayment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLedgerPayments = async (req, res) => {
    try {
        const payments = await LedgerPayment.find({ tenantId: req.user.tenantId })
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLedgerPaymentById = async (req, res) => {
    try {
        const payment = await LedgerPayment.findOne({
            _id: req.params.id,
            tenantId: req.user.tenantId
        }).populate('partyId', 'name phone address');

        if (!payment) {
            res.status(404).json({ message: 'Receipt not found' });
            return;
        }
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createLedgerPayment, getLedgerPayments, getLedgerPaymentById };
