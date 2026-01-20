import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Vendor from './models/Vendor.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import connectDB from './config/db.js';

dotenv.config();

const seedRealistic = async () => {
    try {
        await connectDB();

        // 1. Get Tenant ID from Admin
        const admin = await User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            console.error('❌ Admin user not found! Please run node seeder.js first.');
            process.exit(1);
        }
        const tenantId = admin.tenantId;
        console.log(`Using Tenant ID: ${tenantId}`);

        // 2. Create Vendors (10)
        const vendorsData = [
            { name: 'Samsung India Electronics', address: 'Gurugram, Haryana', openingBalance: 0 },
            { name: 'Xiaomi Technology India', address: 'Bengaluru, Karnataka', openingBalance: 0 },
            { name: 'Apple India Pvt Ltd', address: 'Mumbai, Maharashtra', openingBalance: 0 },
            { name: 'OnePlus India', address: 'Hyderabad, Telangana', openingBalance: 0 },
            { name: 'Realme Mobile', address: 'Gurugram, Haryana', openingBalance: 0 },
            { name: 'Oppo Mobiles', address: 'Noida, UP', openingBalance: 0 },
            { name: 'Vivo India', address: 'Greater Noida, UP', openingBalance: 0 },
            { name: 'Sony India', address: 'New Delhi', openingBalance: 0 },
            { name: 'Boat Lifestyle', address: 'Mumbai, Maharashtra', openingBalance: 0 },
            { name: 'JBL Harman', address: 'Bengaluru, Karnataka', openingBalance: 0 }
        ];

        // Clear existing data for a clean slate (optional, but good for testing)
        // await Vendor.deleteMany({ tenantId });
        // await Product.deleteMany({ tenantId });
        // await Customer.deleteMany({ tenantId });

        console.log('Creating Vendors...');
        const createdVendors = [];
        for (const v of vendorsData) {
            const vendor = await Vendor.create({ ...v, tenantId });
            createdVendors.push(vendor);
        }
        console.log(`✅ Created ${createdVendors.length} vendors`);

        // 3. Create Products (100 total, ~10 per vendor category)
        console.log('Creating Products...');
        const productsData = [];

        const createProduct = (name, price, purchasePrice, gst, stock, brand) => ({
            name: `${brand} ${name}`,
            price,
            purchasePrice,
            gstRate: gst,
            stock,
            hsn: '8517',
            barcode: Math.floor(Math.random() * 1000000000000).toString(),
            tenantId
        });

        // Samsung Products
        productsData.push(
            createProduct('Galaxy S24 Ultra', 129999, 110000, 18, 50, 'Samsung'),
            createProduct('Galaxy S24', 79999, 65000, 18, 50, 'Samsung'),
            createProduct('Galaxy Z Fold5', 154999, 130000, 18, 20, 'Samsung'),
            createProduct('Galaxy Z Flip5', 99999, 80000, 18, 30, 'Samsung'),
            createProduct('Galaxy Tab S9', 72999, 60000, 18, 40, 'Samsung'),
            createProduct('Galaxy Watch 6', 29999, 22000, 18, 60, 'Samsung'),
            createProduct('Galaxy Buds2 Pro', 14999, 10000, 18, 100, 'Samsung'),
            createProduct('25W Travel Adapter', 1299, 800, 18, 200, 'Samsung'),
            createProduct('Galaxy Book3', 89999, 75000, 18, 15, 'Samsung'),
            createProduct('MGM Monitor 27"', 18999, 14000, 18, 25, 'Samsung')
        );

        // Xiaomi (Mi) Products
        productsData.push(
            createProduct('14 Ultra', 99999, 85000, 18, 40, 'Xiaomi'),
            createProduct('14', 69999, 58000, 18, 50, 'Xiaomi'),
            createProduct('Redmi Note 13 Pro+', 31999, 26000, 18, 100, 'Redmi'),
            createProduct('Pad 6', 26999, 21000, 18, 60, 'Xiaomi'),
            createProduct('Smart TV X Series 50"', 32999, 25000, 18, 30, 'Xiaomi'),
            createProduct('Robot Vacuum Mop', 24999, 18000, 18, 20, 'Xiaomi'),
            createProduct('Smart Air Purifier 4', 12999, 9000, 18, 40, 'Xiaomi'),
            createProduct('Power Bank 3i', 1999, 1200, 18, 150, 'Redmi'),
            createProduct('Smart Band 8', 2999, 1800, 18, 120, 'Xiaomi'),
            createProduct('Beard Trimmer 2C', 1199, 800, 18, 80, 'Xiaomi')
        );

        // Apple Products
        productsData.push(
            createProduct('iPhone 15 Pro Max', 159900, 140000, 18, 30, 'Apple'),
            createProduct('iPhone 15', 79900, 68000, 18, 60, 'Apple'),
            createProduct('MacBook Air M3', 114900, 95000, 18, 25, 'Apple'),
            createProduct('iPad Air', 59900, 50000, 18, 40, 'Apple'),
            createProduct('AirPods Pro 2', 24900, 19000, 18, 80, 'Apple'),
            createProduct('Watch Series 9', 41900, 35000, 18, 45, 'Apple'),
            createProduct('MagSafe Charger', 4500, 3000, 18, 100, 'Apple'),
            createProduct('HomePod mini', 9900, 7500, 18, 50, 'Apple'),
            createProduct('AirTag', 3490, 2500, 18, 200, 'Apple'),
            createProduct('20W USB-C Adapter', 1900, 1200, 18, 150, 'Apple')
        );

        // OnePlus Products
        productsData.push(
            createProduct('12', 64999, 54000, 18, 50, 'OnePlus'),
            createProduct('12R', 39999, 32000, 18, 80, 'OnePlus'),
            createProduct('Open', 139999, 115000, 18, 20, 'OnePlus'),
            createProduct('Pad', 37999, 30000, 18, 40, 'OnePlus'),
            createProduct('Buds Pro 2', 11999, 8000, 18, 100, 'OnePlus'),
            createProduct('Nord CE 4', 24999, 20000, 18, 120, 'OnePlus'),
            createProduct('Watch 2', 24999, 18000, 18, 40, 'OnePlus'),
            createProduct('SuperVOOC 80W Charger', 2999, 1800, 18, 100, 'OnePlus'),
            createProduct('Bullets Wireless Z2', 1999, 1200, 18, 150, 'OnePlus'),
            createProduct('Nord Wired Earphones', 799, 450, 18, 200, 'OnePlus')
        );

        // Realme Products
        productsData.push(
            createProduct('12 Pro+', 29999, 24000, 18, 80, 'Realme'),
            createProduct('Narzo 60', 17999, 14000, 18, 100, 'Realme'),
            createProduct('GT 2 Pro', 49999, 40000, 18, 30, 'Realme'),
            createProduct('Pad 2', 19999, 15000, 18, 50, 'Realme'),
            createProduct('Buds Air 5', 3499, 2200, 18, 120, 'Realme'),
            createProduct('Watch 3 Pro', 4999, 3500, 18, 60, 'Realme'),
            createProduct('TechLife Air Purifier', 7999, 5500, 18, 30, 'Realme'),
            createProduct('Hair Dryer', 1499, 900, 18, 80, 'Realme'),
            createProduct('Beard Trimmer', 1299, 800, 18, 100, 'Realme'),
            createProduct('Power Bank 10000mAh', 1299, 800, 18, 150, 'Realme')
        );

        // Boat Products (Accessories)
        productsData.push(
            createProduct('Rockerz 450', 1499, 800, 18, 200, 'Boat'),
            createProduct('Airdopes 141', 1299, 700, 18, 250, 'Boat'),
            createProduct('Stone 350 Speaker', 1999, 1200, 18, 100, 'Boat'),
            createProduct('Wave Call Smartwatch', 2499, 1500, 18, 100, 'Boat'),
            createProduct('Bassheads 100', 399, 200, 18, 500, 'Boat'),
            createProduct('Immortal 121', 1499, 900, 18, 100, 'Boat'),
            createProduct('PartyPal 50', 3999, 2800, 18, 40, 'Boat'),
            createProduct('Rockerz 255 Pro+', 1299, 800, 18, 200, 'Boat'),
            createProduct('Xtend Watch', 2999, 1800, 18, 80, 'Boat'),
            createProduct('Aavante Bar', 5999, 4000, 18, 30, 'Boat')
        );

        // JBL Products
        productsData.push(
            createProduct('Flip 6', 9999, 7500, 18, 40, 'JBL'),
            createProduct('Charge 5', 14999, 11000, 18, 30, 'JBL'),
            createProduct('Tune 510BT', 3499, 2500, 18, 80, 'JBL'),
            createProduct('Wave 200', 3999, 2800, 18, 60, 'JBL'),
            createProduct('PartyBox 110', 29999, 22000, 18, 15, 'JBL'),
            createProduct('Go 3', 2999, 2000, 18, 100, 'JBL'),
            createProduct('Live Pro 2', 11999, 9000, 18, 40, 'JBL'),
            createProduct('Quantum 100', 2499, 1800, 18, 50, 'JBL'),
            createProduct('Bar 2.1 Deep Bass', 24999, 19000, 18, 20, 'JBL'),
            createProduct('Endurance Run', 1999, 1400, 18, 60, 'JBL')
        );

        // Sony Products
        productsData.push(
            createProduct('PlayStation 5', 54990, 48000, 18, 25, 'Sony'),
            createProduct('WH-1000XM5', 29990, 24000, 18, 40, 'Sony'),
            createProduct('WF-1000XM5', 24990, 19000, 18, 50, 'Sony'),
            createProduct('Bravia 55" 4K', 64990, 52000, 18, 20, 'Sony'),
            createProduct('Alpha 7M4', 214990, 180000, 18, 10, 'Sony'),
            createProduct('ZV-E10', 59990, 48000, 18, 15, 'Sony'),
            createProduct('SRS-XB100', 4990, 3500, 18, 60, 'Sony'),
            createProduct('HT-S40R', 24990, 19000, 18, 25, 'Sony'),
            createProduct('Inzone H9', 22990, 18000, 18, 20, 'Sony'),
            createProduct('X85L TV 65"', 114990, 95000, 18, 10, 'Sony')
        );

        // Vivo Products
        productsData.push(
            createProduct('X100 Pro', 89999, 75000, 18, 30, 'Vivo'),
            createProduct('X100', 63999, 52000, 18, 40, 'Vivo'),
            createProduct('V30 Pro', 41999, 34000, 18, 60, 'Vivo'),
            createProduct('V30', 33999, 27000, 18, 80, 'Vivo'),
            createProduct('Y200e', 19999, 16000, 18, 100, 'Vivo'),
            createProduct('T2 Pro', 23999, 19000, 18, 90, 'Vivo'),
            createProduct('X Fold3', 159999, 135000, 18, 10, 'Vivo'),
            createProduct('TWS 3e', 2999, 1800, 18, 150, 'Vivo'),
            createProduct('FlashCharge 80W', 2499, 1500, 18, 80, 'Vivo'),
            createProduct('Y28 5G', 13999, 11000, 18, 120, 'Vivo')
        );

        // Oppo Products
        productsData.push(
            createProduct('Find N3 Flip', 94999, 80000, 18, 30, 'Oppo'),
            createProduct('Reno 11 Pro', 39999, 32000, 18, 50, 'Oppo'),
            createProduct('Reno 11', 29999, 24000, 18, 80, 'Oppo'),
            createProduct('F25 Pro', 23999, 19000, 18, 100, 'Oppo'),
            createProduct('A79 5G', 19999, 16000, 18, 120, 'Oppo'),
            createProduct('A59 5G', 13999, 11000, 18, 150, 'Oppo'),
            createProduct('Enco Air3 Pro', 4999, 3200, 18, 80, 'Oppo'),
            createProduct('Enco Buds2', 1799, 1100, 18, 200, 'Oppo'),
            createProduct('Pad Neo', 21999, 17000, 18, 40, 'Oppo'),
            createProduct('SuperVOOC 100W', 3499, 2200, 18, 60, 'Oppo')
        );

        await Product.insertMany(productsData);
        console.log(`✅ Created ${productsData.length} products`);

        // 4. Create Customers (5)
        console.log('Creating Customers...');
        const customersData = [
            { name: 'Rahul Sharma', phone: '9876543210', email: 'rahul.s@example.com', address: 'Delhi', tenantId },
            { name: 'Priya Patel', phone: '9876543211', email: 'priya.p@example.com', address: 'Mumbai', tenantId },
            { name: 'Amit Kumar', phone: '9876543212', email: 'amit.k@example.com', address: 'Bangalore', tenantId },
            { name: 'Sneha Gupta', phone: '9876543213', email: 'sneha.g@example.com', address: 'Hyderabad', tenantId },
            { name: 'Vikram Singh', phone: '9876543214', email: 'vikram.s@example.com', address: 'Chennai', tenantId }
        ];

        await Customer.insertMany(customersData);
        console.log(`✅ Created ${customersData.length} customers`);

        console.log('🎉 Realistic data seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedRealistic();
