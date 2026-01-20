import AuditLog from '../models/AuditLog.js';

/**
 * Log an activity to the database
 * @param {string} tenantId - The tenant ID
 * @param {string} userId - The user ID performing the action
 * @param {string} action - Action type (e.g., 'LOGIN', 'DELETE_BILL')
 * @param {string} details - Human readable details
 * @param {object} metadata - Optional technical details
 */
const logActivity = async (tenantId, userId, action, details, metadata = {}) => {
    try {
        await AuditLog.create({
            tenantId,
            user: userId,
            action,
            details,
            metadata
        });
    } catch (error) {
        console.error('Audit Log Failed:', error);
        // Don't crash the app if logging fails
    }
};

export default logActivity;
