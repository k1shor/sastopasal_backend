const ProductModel = require("../models/productModel");
const CategoryModel = require("../models/categoryModel");
const { collectUploadedFiles, uploadImages } = require("../utils/uploadImages");

const isAdmin = (user) => user.role === 2;
const isSellerOrAdmin = (product, user) => {
  return product.seller.toString() === user._id.toString() || isAdmin(user);
};

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes"].includes(String(value).toLowerCase());
};

const buildProductPayload = (body, userId) => {
  const payload = {
    name: body.name,
    description: body.description,
    price: body.price,
    category: body.category,
    brand: body.brand,
    stock: body.stock,
    productType: body.productType,
    usedCondition: body.usedCondition,
    productAge: body.productAge,
    defects: body.defects,
    isAvailable: parseBoolean(body.isAvailable, undefined),
  };

  if (body.images) {
    payload.images = Array.isArray(body.images) ? body.images : [body.images];
    payload.image = payload.images[0] || "";
  } else if (body.image) {
    payload.image = body.image;
    payload.images = [body.image];
  }

  if (userId) {
    payload.seller = userId;
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

exports.createProduct = async (req, res) => {
  const { name, description, price, category, productType, usedCondition } =
    req.body;

  if (!name || !description || price === undefined || !category) {
    return res.status(400).json({
      error: "Please provide name, description, price, and category.",
    });
  }

  if (productType === "used" && !usedCondition) {
    return res.status(400).json({
      error: "Used products must include usedCondition.",
    });
  }

  let categoryExists = await CategoryModel.findById(category);

  if (!categoryExists) {
    return res.status(404).json({ error: "Category not found." });
  }

  const uploadedImages = await uploadImages(
    collectUploadedFiles(req),
    "sasto-pasal/products",
  );

  const payload = buildProductPayload(req.body, req.user._id);

  if (uploadedImages.length > 0) {
    payload.images = uploadedImages;
    payload.image = uploadedImages[0];
  }

  let product = await ProductModel.create(payload);

  res.status(201).send({
    message: "Product created successfully.",
    product,
  });
};

exports.getProducts = async (req, res) => {
  const { keyword, category, minPrice, maxPrice, brand, productType, seller } =
    req.query;

  const filter = { isAvailable: true };

  if (keyword) {
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { brand: { $regex: keyword, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = { $regex: brand, $options: "i" };
  }

  if (productType) {
    filter.productType = productType;
  }

  if (seller) {
    filter.seller = seller;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  let products = await ProductModel.find(filter)
    .populate("category", "name slug")
    .populate("seller", "username email")
    .sort({ createdAt: -1 });

  res.send(products);
};

exports.getProduct = async (req, res) => {
  let product = await ProductModel.findById(req.params.id)
    .populate("category", "name slug")
    .populate("seller", "username email");

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  res.send(product);
};

exports.updateProduct = async (req, res) => {
  let product = await ProductModel.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  if (!isSellerOrAdmin(product, req.user)) {
    return res.status(403).json({
      error: "You are not allowed to update this product.",
    });
  }

  if (req.body.category) {
    let categoryExists = await CategoryModel.findById(req.body.category);

    if (!categoryExists) {
      return res.status(404).json({ error: "Category not found." });
    }
  }

  const updates = buildProductPayload(req.body);

  const uploadedImages = await uploadImages(
    collectUploadedFiles(req),
    "sasto-pasal/products",
  );

  if (uploadedImages.length > 0) {
    updates.images = uploadedImages;
    updates.image = uploadedImages[0];
  }

  Object.assign(product, updates);

  if (product.productType === "used" && !product.usedCondition) {
    return res.status(400).json({
      error: "Used products must include usedCondition.",
    });
  }

  await product.save();

  res.send({
    message: "Product updated successfully.",
    product,
  });
};

exports.deleteProduct = async (req, res) => {
  let product = await ProductModel.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  if (!isSellerOrAdmin(product, req.user)) {
    return res.status(403).json({
      error: "You are not allowed to delete this product.",
    });
  }

  await ProductModel.findByIdAndDelete(req.params.id);

  res.send({ message: "Product deleted successfully." });
};

exports.getSellerProducts = async (req, res) => {
  let products = await ProductModel.find({ seller: req.user._id })
    .populate("category", "name slug")
    .sort({ createdAt: -1 });

  res.send(products);
};

exports.getProductsByCategory = async (req, res) => {
  let products = await ProductModel.find({
    category: req.params.categoryId,
    isAvailable: true,
  })
    .populate("category", "name slug")
    .populate("seller", "username");

  res.send(products);
};

exports.updateStock = async (req, res) => {
  let product = await ProductModel.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  if (!isSellerOrAdmin(product, req.user)) {
    return res
      .status(403)
      .json({ error: "You are not allowed to update stock." });
  }

  if (req.body.stock === undefined || req.body.stock < 0) {
    return res
      .status(400)
      .json({ error: "Please provide a valid stock value." });
  }

  product.stock = req.body.stock;
  product.isAvailable = product.stock > 0;

  await product.save();

  res.send({
    message: "Product stock updated successfully.",
    product,
  });
};

exports.updateAvailability = async (req, res) => {
  let product = await ProductModel.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  if (!isSellerOrAdmin(product, req.user)) {
    return res.status(403).json({
      error: "You are not allowed to update this product.",
    });
  }

  product.isAvailable = req.body.isAvailable;

  await product.save();

  res.send({
    message: "Product availability updated.",
    product,
  });
};

exports.getAllProductsAdmin = async (req, res) => {
  let products = await ProductModel.find()
    .populate("category", "name slug")
    .populate("seller", "username email")
    .sort({ createdAt: -1 });

  res.send(products);
};

exports.adminDeleteProduct = async (req, res) => {
  let product = await ProductModel.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }

  await ProductModel.findByIdAndDelete(req.params.id);

  res.send({ message: "Product deleted successfully by admin." });
};
