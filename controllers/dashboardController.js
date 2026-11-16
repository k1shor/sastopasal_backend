const CartModel = require("../models/cartModel");
const CategoryModel = require("../models/categoryModel");
const OrderModel = require("../models/orderModel");
const ProductModel = require("../models/productModel");
const ReviewModel = require("../models/reviewModel");
const UserModel = require("../models/userModel");
const WishlistModel = require("../models/wishlistModel");

// admin dashboard gives summary numbers for the admin panel
exports.getAdminDashboard = async (req, res) => {
    const [
        totalUsers,
        totalSellers,
        pendingSellers,
        totalProducts,
        totalCategories,
        totalOrders,
        totalReviews,
        orders
    ] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({ role: 1 }),
        UserModel.countDocuments({ role: 1, sellerStatus: "pending" }),
        ProductModel.countDocuments(),
        CategoryModel.countDocuments(),
        OrderModel.countDocuments(),
        ReviewModel.countDocuments(),
        OrderModel.find()
    ]);

    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter((order) => order.orderStatus === "pending").length;
    const deliveredOrders = orders.filter((order) => order.orderStatus === "delivered").length;

    res.send({
        totalUsers,
        totalSellers,
        pendingSellers,
        totalProducts,
        totalCategories,
        totalOrders,
        totalReviews,
        totalSales,
        pendingOrders,
        deliveredOrders
    });
};

// seller dashboard shows only information related to logged in seller
exports.getSellerDashboard = async (req, res) => {
    const products = await ProductModel.find({ seller: req.user._id });
    const productIds = products.map((product) => product._id);

    const orders = await OrderModel.find({
        "items.product": { $in: productIds }
    }).populate("items.product", "name seller price");

    const sellerOrders = orders.map((order) => {
        const sellerItems = order.items.filter((item) => {
            return item.product?.seller?.toString() === req.user._id.toString();
        });

        const sellerTotal = sellerItems.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        return {
            _id: order._id,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            sellerItems,
            sellerTotal,
            createdAt: order.createdAt
        };
    });

    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalSellerSales = sellerOrders.reduce((sum, order) => sum + order.sellerTotal, 0);

    res.send({
        sellerStatus: req.user.sellerStatus,
        totalProducts: products.length,
        availableProducts: products.filter((product) => product.isAvailable).length,
        totalStock,
        totalOrders: sellerOrders.length,
        totalSellerSales,
        recentOrders: sellerOrders.slice(0, 5)
    });
};

// customer dashboard is useful for testing the customer portal
exports.getCustomerDashboard = async (req, res) => {
    const [cart, wishlist, orders] = await Promise.all([
        CartModel.findOne({ user: req.user._id }),
        WishlistModel.findOne({ user: req.user._id }),
        OrderModel.find({ user: req.user._id })
    ]);

    res.send({
        cartItems: cart?.items?.length || 0,
        wishlistItems: wishlist?.products?.length || 0,
        totalOrders: orders.length,
        pendingOrders: orders.filter((order) => order.orderStatus === "pending").length,
        deliveredOrders: orders.filter((order) => order.orderStatus === "delivered").length
    });
};
