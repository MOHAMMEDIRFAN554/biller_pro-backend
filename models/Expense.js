import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: { type: String, required: true }, // e.g., Rent, Salary, Tea
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
