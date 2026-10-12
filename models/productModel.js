const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    brand: {
        type: String,
        default: "",
        trim: true
    },

    images: [{
        type: String,
        trim: true
    }],

    image: {
        type: String,
        default: ""
    },

    stock: {
        type: Number,
        default: 0,
        min: 0
    },

    productType: {
        type: String,
        enum: ["new", "used"],
        default: "new"
    },

    usedCondition: {
        type: String,
        enum: ["like_new", "excellent", "good", "fair", ""],
        default: ""
    },

    productAge: {
        type: String,
        default: ""
    },

    defects: {
        type: String,
        default: ""
    },

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    isAvailable: {
        type: Boolean,
        default: true
    }
}, { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
