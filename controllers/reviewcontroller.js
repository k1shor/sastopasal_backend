const ReviewModel = require("../models/reviewModel");
const ProductModel = require("../models/productModel");

exports.createReview = async (req, res) => {
    const { productId, rating, comment } = req.body;

    let product = await ProductModel.findById(productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found." });
    }

    // one user should review same product only once
    let alreadyReviewed = await ReviewModel.findOne({
        product: productId,
        user: req.user._id
    });

    if (alreadyReviewed) {
        return res.status(400).json({ error: "You already reviewed this product." });
    }

    let review = await ReviewModel.create({
        product: productId,
        user: req.user._id,
        rating,
        comment
    });

    res.status(201).send({
        message: "Review added.",
        review
    });
};

exports.getProductReviews = async (req, res) => {
    let reviews = await ReviewModel.find({ product: req.params.productId })
        .populate("user", "username")
        .sort({ createdAt: -1 });

    res.send(reviews);
};

exports.deleteReview = async (req, res) => {
    let review = await ReviewModel.findById(req.params.id);

    if (!review) {
        return res.status(404).json({ error: "Review not found." });
    }

    // review owner or admin can delete
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 2) {
        return res.status(403).json({ error: "Not allowed." });
    }

    await ReviewModel.findByIdAndDelete(req.params.id);

    res.send({ message: "Review deleted." });
};