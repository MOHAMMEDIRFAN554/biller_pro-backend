import { encrypt, decrypt } from './encryption.js';

const encryptPlugin = (schema) => {
    // Pre-save hook to encrypt fields marked with encrypt: true
    schema.pre('save', function (next) {
        const doc = this;
        for (const path in schema.paths) {
            const schemaType = schema.paths[path];
            if (schemaType.options && schemaType.options.encrypt) {
                const value = doc.get(path);
                if (value && typeof value === 'string' && !value.includes(':')) {
                    const isSearchable = schemaType.options.searchable || false;
                    doc.set(path, encrypt(value, isSearchable));
                }
            }
        }
        next();
    });

    // Pre-find hooks to encrypt query parameters for searchable fields
    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function (next) {
        const query = this.getQuery();
        for (const path in schema.paths) {
            const schemaType = schema.paths[path];
            if (schemaType.options && schemaType.options.encrypt && schemaType.options.searchable && query[path]) {
                if (typeof query[path] === 'string') {
                    query[path] = encrypt(query[path], true);
                } else if (query[path] && typeof query[path] === 'object' && query[path].$in) {
                    query[path].$in = query[path].$in.map(v => typeof v === 'string' ? encrypt(v, true) : v);
                }
            }
        }
        next();
    });

    // Decrypt document after retrieval
    const decryptDoc = (doc) => {
        if (!doc) return;
        const target = doc._doc || doc;
        for (const path in schema.paths) {
            const schemaType = schema.paths[path];
            if (schemaType.options && schemaType.options.encrypt) {
                let value = target[path];
                if (value && typeof value === 'string' && value.includes(':')) {
                    const decryptedValue = decrypt(value);
                    if (schemaType.instance === 'Number') {
                        target[path] = Number(decryptedValue);
                    } else {
                        target[path] = decryptedValue;
                    }
                }
            }
        }
    };

    // Post-hooks to decrypt after retrieval
    schema.post('find', function (docs) {
        if (Array.isArray(docs)) docs.forEach(decryptDoc);
    });

    schema.post('findOne', function (doc) {
        decryptDoc(doc);
    });

    schema.post('findOneAndUpdate', function (doc) {
        decryptDoc(doc);
    });

    schema.post('save', function (doc) {
        decryptDoc(doc);
    });
};

export default encryptPlugin;
