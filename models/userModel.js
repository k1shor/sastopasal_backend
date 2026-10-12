const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: Number,
        default: 0
        // 0 = customer, 1 = seller, 2 = admin
    },

    sellerStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none"
    },

    isVerified: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        default: ""
    },

    address: {
        type: String,
        default: ""
    },

}, {
     timestamps: true }
    );

module.exports = mongoose.model("User", userSchema);
