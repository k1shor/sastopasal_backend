const WishlistModel = require("../models/wishlistModel");
const ProductModel = require("../models/productModel");

// get or create user's wishlist
const getWishlist = async (userId) => {
    let wishlist = await WishlistModel.findOne({ user: userId });

    if (!wishlist) {
        wishlist = await WishlistModel.create({
            user: userId,
            products: []
        });
    }

    return wishlist;
};

exports.getMyWishlist = async (req, res) => {
    let wishlist = await WishlistModel.findOne({ user: req.user._id })
        .populate("products", "name price image stock isAvailable");

    if (!wishlist) {
        wishlist = await WishlistModel.create({
            user: req.user._id,
            products: []
        });
    }

    res.send(wishlist);
};

exports.addToWishlist = async (req, res) => {
    let product = await ProductModel.findById(req.body.productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found." });
    }

    let wishlist = await getWishlist(req.user._id);

    // avoid duplicate product
    if (!wishlist.products.includes(product._id)) {
        wishlist.products.push(product._id);
        await wishlist.save();
    }

    res.send({
        message: "Product added to wishlist.",
        wishlist
    });
};

exports.removeFromWishlist = async (req, res) => {
    let wishlist = await getWishlist(req.user._id);

    wishlist.products = wishlist.products.filter((productId) => {
        return productId.toString() !== req.params.productId;
    });

    await wishlist.save();

    res.send({
        message: "Product removed from wishlist.",
        wishlist
    });
};