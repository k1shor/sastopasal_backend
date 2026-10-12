const CartModel = require("../models/cartModel");
const ProductModel = require("../models/productModel");

const getOrCreateCart = async (userId) => {
    let cart = await CartModel.findOne({ user: userId });

    if (!cart) {
        cart = await CartModel.create({
            user: userId,
            items: []
        });
    }

    return cart;
};

const populateCart = (query) => {
    return query.populate({
        path: "items.product",
        select: "name price image images stock isAvailable productType usedCondition seller",
        populate: {
            path: "seller",
            select: "username"
        }
    });
};

exports.getCart = async (req, res) => {
    let cart = await populateCart(
        CartModel.findOne({ user: req.user._id })
    );

    if (!cart) {
        cart = await CartModel.create({
            user: req.user._id,
            items: []
        });
    }

    res.send(cart);
};

exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const itemQuantity = Number(quantity || 1);

    if (!productId) {
        return res.status(400).json({ error: "Product id is required." });
    }

    if (itemQuantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    let product = await ProductModel.findById(productId);

    if (!product || !product.isAvailable) {
        return res.status(404).json({ error: "Product not available." });
    }

    if (product.stock < itemQuantity) {
        return res.status(400).json({ error: "Not enough product stock." });
    }

    let cart = await getOrCreateCart(req.user._id);
    let item = cart.items.find((cartItem) => {
        return cartItem.product.toString() === productId;
    });

    if (item) {
        const newQuantity = item.quantity + itemQuantity;

        if (product.stock < newQuantity) {
            return res.status(400).json({ error: "Not enough product stock." });
        }

        item.quantity = newQuantity;
        item.price = product.price;
    } else {
        cart.items.push({
            product: product._id,
            quantity: itemQuantity,
            price: product.price
        });
    }

    await cart.save();

    cart = await populateCart(CartModel.findById(cart._id));

    res.send({
        message: "Product added to cart.",
        cart
    });
};

exports.updateCartItem = async (req, res) => {
    const itemQuantity = Number(req.body.quantity);

    if (!itemQuantity || itemQuantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    let cart = await CartModel.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(404).json({ error: "Cart not found." });
    }

    let item = cart.items.find((cartItem) => {
        return cartItem.product.toString() === req.params.productId;
    });

    if (!item) {
        return res.status(404).json({ error: "Product not found in cart." });
    }

    let product = await ProductModel.findById(req.params.productId);

    if (!product || !product.isAvailable) {
        return res.status(404).json({ error: "Product not available." });
    }

    if (product.stock < itemQuantity) {
        return res.status(400).json({ error: "Not enough product stock." });
    }

    item.quantity = itemQuantity;
    item.price = product.price;

    await cart.save();

    cart = await populateCart(CartModel.findById(cart._id));

    res.send({
        message: "Cart item updated.",
        cart
    });
};

exports.removeCartItem = async (req, res) => {
    let cart = await CartModel.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(404).json({ error: "Cart not found." });
    }

    cart.items = cart.items.filter((cartItem) => {
        return cartItem.product.toString() !== req.params.productId;
    });

    await cart.save();

    cart = await populateCart(CartModel.findById(cart._id));

    res.send({
        message: "Product removed from cart.",
        cart
    });
};

exports.clearCart = async (req, res) => {
    let cart = await getOrCreateCart(req.user._id);

    cart.items = [];
    cart.couponCode = "";

    await cart.save();

    res.send({
        message: "Cart cleared.",
        cart
    });
};

exports.applyCoupon = async (req, res) => {
    let cart = await getOrCreateCart(req.user._id);

    cart.couponCode = req.body.couponCode || "";

    await cart.save();

    cart = await populateCart(CartModel.findById(cart._id));

    res.send({
        message: "Coupon saved on cart.",
        cart
    });
};
