import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');
        await User.deleteMany({});
        await User.create({
            name: 'Test',
            email: 'test@example.com',
            password: 'password',
            tenantId: '123'
        });
        console.log('Success');
        process.exit();
    } catch (err) {
        console.error('FULL ERROR:', err);
        process.exit(1);
    }
};
test();
