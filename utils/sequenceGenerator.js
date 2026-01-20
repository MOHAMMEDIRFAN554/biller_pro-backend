import Sequence from '../models/Sequence.js';

/**
 * Get next sequence number with prefix
 * @param {string} tenantId 
 * @param {string} type - 'BILL', 'PURCHASE'
 * @param {string} defaultPrefix - 'INV-', 'PUR-'
 */
const generateNextId = async (tenantId, type, defaultPrefix = '') => {
    try {
        const sequence = await Sequence.findOneAndUpdate(
            { tenantId, type },
            { $inc: { value: 1 }, $setOnInsert: { prefix: defaultPrefix } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Format: PREFIX-0001
        // If prefix is empty in DB (user cleared it), use empty.
        // If it was just created, it used defaultPrefix inside $setOnInsert, but we might want to ensure it sticks if user didn't exist? 
        // Logic: upsert will set prefix if doc didn't exist.

        return `${sequence.prefix}${String(sequence.value).padStart(4, '0')}`;
    } catch (error) {
        throw new Error(`Sequence Generation Failed: ${error.message}`);
    }
};

export default generateNextId;
