import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from './models/Customer.js';
import Vendor from './models/Vendor.js';
import Product from './models/Product.js';
import Bill from './models/Bill.js';
import Purchase from './models/Purchase.js';
import LedgerPayment from './models/LedgerPayment.js';
import SalesReturn from './models/SalesReturn.js';
import PurchaseReturn from './models/PurchaseReturn.js';
import Expense from './models/Expense.js';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        const user = await User.findOne();
        if (!user) {
            console.error('No users found. Please register a user first.');
            process.exit(1);
        }
        const tenantId = user.tenantId;
        console.log(`Seeding data for Tenant: ${tenantId}`);

        console.log('Clearing Database (except Users)...');
        await Customer.deleteMany();
        await Vendor.deleteMany();
        await Product.deleteMany();
        await Bill.deleteMany();
        await Purchase.deleteMany();
        await LedgerPayment.deleteMany();
        await SalesReturn.deleteMany();
        await PurchaseReturn.deleteMany();
        await Expense.deleteMany();

        console.log('Database Cleared.');

        // Let's create Vendors
        const vendors = [];
        for (let i = 1; i <= 10; i++) {
            vendors.push({
                name: `Vendor ${i} Enterprise`,
                phone: `999888777${i % 10}`,
                email: `vendor${i}@example.com`,
                address: `Industrial Area, Sector ${i}, City`,
                gstin: `29ABCDE1234F1Z${i % 10}`,
                tenantId: tenantId
            });
        }
        const createdVendors = await Vendor.insertMany(vendors);
        console.log('Vendors Created.');

        // Products
        const products = [];
        const categories = ['Electronics', 'Home Appliances', 'Accessories', 'Mobile', 'Computer'];

        for (const vendor of createdVendors) {
            for (let j = 1; j <= 5; j++) {
                const basePrice = Math.floor(Math.random() * 5000) + 500; // Cost
                const gstRate = [5, 12, 18, 28][Math.floor(Math.random() * 4)];
                const margin = 1.2; // 20% margin

                const purchasePrice = basePrice;
                const sellingPrice = Math.round(basePrice * margin * (1 + gstRate / 100));

                products.push({
                    name: `Product ${vendor.name.split(' ')[1]} - Item ${j}`,
                    barcode: `BAR${vendor._id.toString().slice(-4)}${j}`,
                    category: categories[Math.floor(Math.random() * categories.length)],
                    purchasePrice: purchasePrice,
                    price: sellingPrice,
                    gstRate: gstRate,
                    stock: Math.floor(Math.random() * 50) + 10,
                    minStock: 5,
                    vendor: vendor._id,
                    tenantId: tenantId
                });
            }
        }
        await Product.insertMany(products);
        console.log('Products Created.');

        // Customers
        const customers = [];
        for (let k = 1; k <= 5; k++) {
            customers.push({
                name: `Customer ${k}`,
                phone: `987654321${k}`,
                email: `customer${k}@test.com`,
                address: `Residential Layout ${k}, City`,
                tenantId: tenantId
            });
        }
        await Customer.insertMany(customers);
        console.log('Customers Created.');

        console.log('Data Seeding Completed!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

seedData();
