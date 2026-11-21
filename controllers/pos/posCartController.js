const mongoose = require("mongoose");
const posCartModel = require("./posCartModel");
const productModel = require("../product/productModel");

// find a seller's cart or create a new one if it doesn't exist
const getOrCreateCart = (sellerId) => {
  posCartModel.findOneAndUpdate(
    { seller: sellerId },
    { $setOnInsert: { seller: sellerId, items: [] } },
    { new: true, upsert: true },
  );
};

// helper function to send the cart as a response
const sendCart = async (cart, res, status = 200) => {
  await cart.populate("items.product", "name image stock price");
  res.status(status).json(cart);
};

exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await sendCart(cart, res);
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ error: "Failed to fetch cart." });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const quantity =
      req.body.quantity === undefined ? 1 : Number(req.body.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid product id." });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res
        .status(400)
        .json({ error: "Quantity must be a whole number of at least 1." });
    }

    const product = await ProductModel.findById(productId);

    // 404 for other sellers' products too, so we don't reveal they exist
    if (!product || !product.seller.equals(req.user._id)) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (!product.isAvailable) {
      return res.status(400).json({ error: "Product is not available." });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find((i) => i.product.equals(product._id));
    const newQuantity = (existing ? existing.quantity : 0) + quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock} in stock.` });
    }

    if (existing) {
      existing.quantity = newQuantity;
    } else {
      // price is saved now, so later price edits don't change this sale
      cart.items.push({
        product: product._id,
        quantity,
        price: product.price,
      });
    }

    await cart.save();
    await sendCart(cart, res);
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ error: "Failed to add item to cart." });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid product id." });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        error:
          "Quantity must be a whole number of at least 1. To remove an item, use the remove endpoint.",
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((i) => i.product.equals(productId));

    if (!item) {
      return res.status(404).json({ error: "Item not in cart." });
    }

    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product no longer exists." });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock} in stock.` });
    }

    item.quantity = quantity;

    await cart.save();
    await sendCart(cart, res);
  } catch (err) {
    console.error("updateCartItem error:", err);
    res.status(500).json({ error: "Failed to update cart item." });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid product id." });
    }

    const cart = await getOrCreateCart(req.user._id);
    const before = cart.items.length;

    cart.items = cart.items.filter((i) => !i.product.equals(productId));

    if (cart.items.length === before) {
      return res.status(404).json({ error: "Item not in cart." });
    }

    await cart.save();
    await sendCart(cart, res);
  } catch (err) {
    console.error("removeCartItem error:", err);
    res.status(500).json({ error: "Failed to remove cart item." });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);

    cart.items = [];

    await cart.save();
    await sendCart(cart, res);
  } catch (err) {
    console.error("clearCart error:", err);
    res.status(500).json({ error: "Failed to clear cart." });
  }
};
