import mongoose from 'mongoose';

const purchaseReturnSchema = new mongoose.Schema({
    originalPurchase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Purchase',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        refundAmount: { type: Number, required: true } // Amount received back from vendor
    }],
    totalRefundAmount: { type: Number, required: true },
    reason: { type: String },
    tenantId: { type: String, required: true, index: true }
}, { timestamps: true });

const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);

export default PurchaseReturn;
