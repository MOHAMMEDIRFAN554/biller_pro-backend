import mongoose from 'mongoose';

const companyProfileSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        default: 'My Shop'
    },
    address: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    upiId: {
        type: String,
        default: ''
    },
    upiName: {
        type: String,
        default: ''
    },
    enableQrPayments: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema);

export default CompanyProfile;
