import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import Vendor from './models/Vendor.js';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos-app');
        console.log('Connected to DB');

        const user = await User.findOne({ email: 'admin@example.com' });
        if (!user) {
            console.log('Admin user not found');
            process.exit(1);
        }
        const tenantId = user.tenantId;

        // 1. Add 10 Vendors
        const vendors = Array.from({ length: 10 }).map((_, i) => ({
            name: `VENDOR ${i + 1} ELECTRONICS`,
            address: `TECH PARK, BLOCK ${String.fromCharCode(65 + i)}, DELHI`,
            openingBalance: 0,
            tenantId
        }));
        await Vendor.deleteMany({ tenantId });
        await Vendor.insertMany(vendors);
        console.log('10 Vendors added');

        // 2. Add 10 Customers
        const customers = Array.from({ length: 10 }).map((_, i) => ({
            name: `CUSTOMER ${i + 1} TEST`,
            phone: `98765432${i}${i}`,
            email: `customer${i + 1}@example.com`,
            address: `STREET ${i + 10}, NEW DELHI`,
            tenantId
        }));
        await Customer.deleteMany({ tenantId });
        await Customer.insertMany(customers);
        console.log('10 Customers added');

        // 3. Add 100 Products (0 Stock)
        const categories = ['MOBILE', 'LAPTOP', 'AUDIO', 'ACCESSORIES', 'STORAGE'];
        const brands = ['APPLE', 'SAMSUNG', 'DELL', 'LOGITECH', 'SONY', 'HP', 'ASUS', 'XIAOMI'];

        const products = [];
        for (let i = 1; i <= 100; i++) {
            const brand = brands[i % brands.length];
            const category = categories[i % categories.length];
            const price = 500 + (Math.floor(Math.random() * 200) * 100);

            products.push({
                name: `${brand} ${category} MODEL-${i}`,
                price,
                gstRate: 18,
                stock: 0,
                hsn: '8517',
                barcode: `BARCODE-${1000 + i}`,
                tenantId
            });
        }
        await Product.deleteMany({ tenantId });
        await Product.insertMany(products);
        console.log('100 Products added (Stock 0)');

        console.log('Mass Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seed();
