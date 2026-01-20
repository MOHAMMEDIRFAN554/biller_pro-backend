import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    ledgerBalance: {
        type: Number,
        default: 0 // +ve means customer owes us, -ve means we owe them (advance)
    },
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for unique phone per tenant
customerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
