const mongoose = require("mongoose"); // NEW
const productModel = require("../../models/productModel");

// NEW: makes special characters in the search text safe, so a keyword like "(" can't break the regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getPosProducts = async (req, res) => {
  // NEW: any unexpected error lands in the catch at the bottom
  try {
    // read the filter from the url
    const { keyword, category, minPrice, maxPrice, brand } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    // filter the products based on the seller and availability
    const filter = { seller: req.user._id, isAvailable: true };

    // search by name or brand, case-insensitive
    if (keyword) {
      const regex = new RegExp(escapeRegex(String(keyword)), "i"); // NEW: escaped
      filter.$or = [{ name: regex }, { brand: regex }];
    }

    // exact match for category
    if (category) {
      // NEW: reject a malformed id instead of letting mongoose crash
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({ error: "Invalid category id." });
      }
      filter.category = category;
    }

    // partial, case-insensitive match for brand
    if (brand) {
      filter.brand = { $regex: escapeRegex(String(brand)), $options: "i" }; // NEW: escaped
    }

    // price range: $gte = greater than or equal, $lte = less than or equal
    if (minPrice !== undefined || maxPrice !== undefined) {
      // NEW: validate the numbers before using them
      if (minPrice !== undefined && !Number.isFinite(Number(minPrice))) {
        return res.status(400).json({ error: "minPrice must be a number." });
      }

      if (maxPrice !== undefined && !Number.isFinite(Number(maxPrice))) {
        return res.status(400).json({ error: "maxPrice must be a number." });
      }

      if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        Number(minPrice) > Number(maxPrice)
      ) {
        return res
          .status(400)
          .json({ error: "minPrice cannot be greater than maxPrice." });
      }

      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // run both queries at the same time
    const [products, total] = await Promise.all([
      productModel
        .find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      productModel.countDocuments(filter),
    ]);

    res.send({
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    // log the real error for you, send a safe message to the client
    console.error("getPosProducts error:", err);
    res.status(500).json({ error: "Failed to fetch products." });
  }
};
