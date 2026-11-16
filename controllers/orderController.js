const OrderModel = require("../models/orderModel");
const CartModel = require("../models/cartModel");
const ProductModel = require("../models/productModel");

// create order from logged in user's cart
exports.createOrder = async (req, res) => {
    let cart = await CartModel.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: "Cart is empty." });
    }

    let totalAmount = 0;
    let orderItems = [];

    // check every cart product before creating order
    for (let item of cart.items) {
        let product = await ProductModel.findById(item.product);

        if (!product || !product.isAvailable) {
            return res.status(400).json({ error: "One product is not available." });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({ error: `${product.name} does not have enough stock.` });
        }

        totalAmount += product.price * item.quantity;

        orderItems.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price
        });

        // reduce stock after order
        product.stock = product.stock - item.quantity;

        if (product.stock === 0) {
            product.isAvailable = false;
        }

        await product.save();
    }

    let order = await OrderModel.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: req.body.paymentMethod || "cod",
        totalAmount
    });

    // clear cart after successful order
    cart.items = [];
    await cart.save();

    res.status(201).send({
        message: "Order placed successfully.",
        order
    });
};

// customer can see own orders
exports.getMyOrders = async (req, res) => {
    let orders = await OrderModel.find({ user: req.user._id })
        .populate("items.product", "name price image")
        .sort({ createdAt: -1 });

    res.send(orders);
};

// admin can see all orders
exports.getAllOrders = async (req, res) => {
    let orders = await OrderModel.find()
        .populate("user", "username email")
        .populate("items.product", "name price")
        .sort({ createdAt: -1 });

    res.send(orders);
};

// get one order
exports.getOrderDetails = async (req, res) => {
    let order = await OrderModel.findById(req.params.id)
        .populate("user", "username email")
        .populate("items.product", "name price image");

    if (!order) {
        return res.status(404).json({ error: "Order not found." });
    }

    // user can only see own order, admin can see all
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 2) {
        return res.status(403).json({ error: "Not allowed." });
    }

    res.send(order);
};

// admin or seller style order status update
exports.updateOrderStatus = async (req, res) => {
    let order = await OrderModel.findById(req.params.id);

    if (!order) {
        return res.status(404).json({ error: "Order not found." });
    }

    order.orderStatus = req.body.orderStatus || order.orderStatus;
    await order.save();

    res.send({
        message: "Order status updated.",
        order
    });
};

// admin can mark online payment as paid or failed after checking gateway result
exports.updatePaymentStatus = async (req, res) => {
    let order = await OrderModel.findById(req.params.id);

    if (!order) {
        return res.status(404).json({ error: "Order not found." });
    }

    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
    order.transactionId = req.body.transactionId || order.transactionId;
    await order.save();

    res.send({
        message: "Payment status updated.",
        order
    });
};

// customer can cancel before shipped
exports.cancelOrder = async (req, res) => {
    let order = await OrderModel.findById(req.params.id);

    if (!order) {
        return res.status(404).json({ error: "Order not found." });
    }

    if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not allowed." });
    }

    if (order.orderStatus === "shipped" || order.orderStatus === "delivered") {
        return res.status(400).json({ error: "Order cannot be cancelled now." });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.send({
        message: "Order cancelled.",
        order
    });
};

// simple report for admin dashboard cards
exports.getSalesReport = async (req, res) => {
    let orders = await OrderModel.find();

    let totalOrders = orders.length;
    let totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    let deliveredOrders = orders.filter((order) => order.orderStatus === "delivered").length;
    let pendingOrders = orders.filter((order) => order.orderStatus === "pending").length;

    res.send({
        totalOrders,
        totalSales,
        deliveredOrders,
        pendingOrders
    });
};
