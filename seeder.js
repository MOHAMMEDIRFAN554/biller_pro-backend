import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';
import crypto from 'crypto';

dotenv.config();

const createAdmin = async () => {
    await connectDB();

    const adminExists = await User.findOne({ email: 'admin@example.com' });

    if (adminExists) {
        console.log('Admin already exists');
        process.exit();
    }

    const tenantId = crypto.randomUUID();

    await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        tenantId
    });

    console.log(`Admin created!
    Email: admin@example.com
    Password: password123
    Tenant ID: ${tenantId}`);

    process.exit();
};

createAdmin();
