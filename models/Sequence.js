import mongoose from 'mongoose';

const sequenceSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String, // 'BILL', 'PURCHASE', 'PRODUCT'
        required: true
    },
    value: {
        type: Number,
        default: 0
    },
    prefix: {
        type: String,
        default: '' // Defaults: BILL -> INV-, PURCHASE -> PUR-
    }
});

// Compound index for unique sequence per type per tenant
sequenceSchema.index({ tenantId: 1, type: 1 }, { unique: true });

const Sequence = mongoose.model('Sequence', sequenceSchema);

export default Sequence;
