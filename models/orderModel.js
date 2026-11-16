const mongoose = require("mongoose");

// each product inside an order
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    price: {
        type: Number,
        required: true
    }
}, { _id: false });

// main order schema
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    items: [orderItemSchema],

    shippingAddress: {
        fullName: String,
        phone: String,
        address: String,
        city: String
    },

    paymentMethod: {
        type: String,
        enum: ["cod", "online"],
        default: "cod"
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },

    transactionId: {
        type: String,
        default: ""
    },

    totalAmount: {
        type: Number,
        required: true
    },

    orderStatus: {
        type: String,
        enum: ["pending", "accepted", "shipped", "delivered", "cancelled"],
        default: "pending"
    }
}, { timestamps: true 
    
});

module.exports = mongoose.model("Order", orderSchema);
