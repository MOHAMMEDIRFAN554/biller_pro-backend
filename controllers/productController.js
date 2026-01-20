// import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 12; // POS needs more items per page
        const page = Number(req.query.page) || 1;

        const keyword = req.query.keyword
            ? {
                $or: [
                    { name: { $regex: req.query.keyword, $options: 'i' } },
                    { barcode: { $regex: req.query.keyword, $options: 'i' } }
                ]
            }
            : {};

        // Tenant Filter
        const query = { ...keyword, tenantId: req.user.tenantId };

        const count = await Product.countDocuments(query);
        const products = await Product.find(query)
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ products, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            tenantId: req.user.tenantId
        });

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
    try {
        const { name, purchasePrice, price, gstRate, hsn, barcode, stock } = req.body;

        if (barcode) {
            const existingProduct = await Product.findOne({ barcode, tenantId: req.user.tenantId });
            if (existingProduct) {
                res.status(400).json({ message: 'Barcode already exists' });
                return;
            }
        }

        const product = new Product({
            name,
            purchasePrice: purchasePrice || 0,
            price,
            gstRate,
            hsn,
            barcode,
            stock: stock || 0,
            tenantId: req.user.tenantId,
            batches: [{
                batchNumber: 'BTH-START',
                purchasePrice: purchasePrice || 0,
                sellingPrice: price,
                stock: stock || 0
            }]
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, purchasePrice, price, gstRate, hsn, barcode, stock } = req.body;

        const product = await Product.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

        if (product) {
            product.name = name || product.name;
            product.purchasePrice = purchasePrice !== undefined ? purchasePrice : product.purchasePrice;
            product.price = price !== undefined ? price : product.price;
            product.gstRate = gstRate || product.gstRate;
            product.hsn = hsn || product.hsn;
            product.barcode = barcode || product.barcode;
            product.stock = stock !== undefined ? stock : product.stock;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

        if (product) {
            await product.deleteOne(); // or remove() in older mongoose
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
