import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    batchNumber: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Selling Price (Inc Tax usually, but stored as unit price)
    quantity: { type: Number, required: true },
    returnedQuantity: { type: Number, default: 0 },
    gstRate: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 }, // Line item discount
    proratedBillDiscount: { type: Number, default: 0 }, // Share of Bill-level discount
    totalAmount: { type: Number, required: true } // Net amount for this line
});

const paymentSchema = new mongoose.Schema({
    mode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Credit'], required: true },
    amount: { type: Number, required: true },
    reference: { type: String } // Transaction ID for UPI/Card
});

const billSchema = new mongoose.Schema({
    billNumber: { type: String, required: true }, // Auto-generated e.g., INV-001
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    items: [billItemSchema],
    subTotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 }, // Bill level discount
    grandTotal: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },

    payments: [paymentSchema],
    paidAmount: { type: Number, default: 0 },
    returnedAmount: { type: Number, default: 0 },
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

// Compound index for unique bill number per tenant
billSchema.index({ tenantId: 1, billNumber: 1 }, { unique: true });

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
