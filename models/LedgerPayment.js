import mongoose from 'mongoose';

const ledgerPaymentSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true
    },
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'partyType'
    },
    partyType: {
        type: String,
        required: true,
        enum: ['Customer', 'Vendor']
    },
    paymentNumber: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    totalPaid: {
        type: Number,
        required: true
    },
    payments: [{
        mode: { type: String, enum: ['Cash', 'UPI', 'Bank', 'Card'], required: true },
        amount: { type: Number, required: true },
        reference: { type: String }
    }],
    note: {
        type: String
    }
}, {
    timestamps: true
});

ledgerPaymentSchema.index({ tenantId: 1, paymentNumber: 1 }, { unique: true });

const LedgerPayment = mongoose.model('LedgerPayment', ledgerPaymentSchema);

export default LedgerPayment;
