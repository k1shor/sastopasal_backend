const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },

    price: {
        type: Number,
        required: true,
        min: 0
    }
}, 
{ _id: false }
);

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    items: [cartItemSchema],

    couponCode: {
        type: String,
        default: ""
    }
}, { timestamps: true });

cartSchema.virtual("total").get(function () {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Cart", cartSchema);
