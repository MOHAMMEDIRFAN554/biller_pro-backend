import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    batchNumber: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    gstRate: {
        type: Number,
        required: true,
        default: 0
    },
    hsn: {
        type: String,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    batches: [batchSchema],
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for unique barcode per tenant
productSchema.index({ tenantId: 1, barcode: 1 }, { unique: true, partialFilterExpression: { barcode: { $type: "string" } } });

const Product = mongoose.model('Product', productSchema);

export default Product;
