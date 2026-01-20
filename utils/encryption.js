import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const algorithm = 'aes-256-cbc';
// Use ENCRYPTION_KEY from env, or a fallback (warn user to set it)
const secret = process.env.ENCRYPTION_KEY || '68656c6c6f776f726c6431323334353637383930313233343536373839303132';
const key = Buffer.from(secret, 'hex');

export const encrypt = (text, deterministic = false) => {
    if (text === null || text === undefined || text === '') return text;
    const strText = String(text);
    const iv = deterministic ? Buffer.alloc(16, 0) : crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(strText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return (deterministic ? 'det:' : iv.toString('hex') + ':') + encrypted;
};

export const decrypt = (text) => {
    if (typeof text !== 'string' || !text.includes(':')) return text;
    try {
        const parts = text.split(':');
        const iv = parts[0] === 'det' ? Buffer.alloc(16, 0) : Buffer.from(parts[0], 'hex');
        const encryptedHex = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return text;
    }
};

export const generateSignature = (data) => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(data));
    return hmac.digest('hex');
};

// Helper to encrypt/decrypt objects recursively
export const encryptObject = (obj, excludeKeys = ['_id', 'tenantId', 'createdAt', 'updatedAt', '__v']) => {
    if (!obj || typeof obj !== 'object') return obj;
    const newObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (excludeKeys.includes(key)) {
            newObj[key] = obj[key];
        } else if (typeof obj[key] === 'object') {
            newObj[key] = encryptObject(obj[key], excludeKeys);
        } else {
            newObj[key] = encrypt(obj[key]);
        }
    }
    return newObj;
};

export const decryptObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const newObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            newObj[key] = decryptObject(obj[key]);
        } else {
            newObj[key] = decrypt(obj[key]);
        }
    }
    return newObj;
};
