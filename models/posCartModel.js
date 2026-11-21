const mongoose = require("mongoose");

// made it similar to the existing cart model
const posCartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const posCartSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [posCartItemSchema],
  },
  { timestamps: true },
);

posCartSchema.virtual("total").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

posCartSchema.set("toJSON", { virtuals: true });
posCartSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("PosCart", posCartSchema);
