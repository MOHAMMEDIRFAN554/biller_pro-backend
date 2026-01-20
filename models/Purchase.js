import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: { type: Number, required: true },
    purchasePrice: { type: Number, required: true }, // Unit Price
    totalAmount: { type: Number, required: true }
});

const paymentSchema = new mongoose.Schema({
    mode: { type: String, enum: ['Cash', 'UPI', 'Bank', 'Credit'], required: true },
    amount: { type: Number, required: true },
    reference: { type: String }
});

const purchaseSchema = new mongoose.Schema({
    voucherNumber: { type: String, required: true }, // e.g., PUR-001
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    items: [purchaseItemSchema],
    totalAmount: { type: Number, required: true },

    payments: [paymentSchema],
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Unsettled', 'Partially Settled', 'Fully Settled'],
        default: 'Unsettled'
    },

    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;
