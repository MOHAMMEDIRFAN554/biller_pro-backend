import mongoose from 'mongoose';

const salesReturnSchema = new mongoose.Schema({
    originalBill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        refundAmount: { type: Number, required: true } // Amount returned to customer
    }],
    totalRefundAmount: { type: Number, required: true },
    refundMode: { type: String, enum: ['Cash', 'UPI', 'Ledger'], default: 'Cash' },
    refundReference: { type: String },
    reason: { type: String },
    tenantId: { type: String, required: true, index: true }
}, { timestamps: true });

const SalesReturn = mongoose.model('SalesReturn', salesReturnSchema);

export default SalesReturn;
