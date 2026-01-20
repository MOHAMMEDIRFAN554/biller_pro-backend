import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    ledgerBalance: {
        type: Number,
        default: 0 // +ve means we owe vendor, -ve means vendor owes us (advance)
    },
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
