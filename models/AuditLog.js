import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true // e.g., 'LOGIN', 'CREATE_BILL', 'DELETE_PRODUCT'
    },
    details: {
        type: String // Readable description
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed // JSON object for technical details (oldValue, newValue)
    },
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Auto-expire logs after 12 months (Requirement)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
