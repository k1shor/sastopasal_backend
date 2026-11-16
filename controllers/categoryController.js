const mongoose = require("mongoose");
const CategoryModel = require("../models/categoryModel");
const ProductModel = require("../models/productModel");
const { uploadImage } = require("../utils/uploadImages");

const makeSlug = (value) => {
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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

const normalizeParent = (value) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    const text = String(value).trim();

    if (text === "" || text === "null" || text === "undefined") {
        return null;
    }

    return text;
};

exports.createCategory = async (req, res) => {
    const name = String(req.body.name || "").trim();
    const description = req.body.description;
    const parent = normalizeParent(req.body.parent);

    if (!name) {
        return res.status(400).json({ error: "Category name is required." });
    }

    const slug = req.body.slug ? makeSlug(req.body.slug) : makeSlug(name);

    let categoryExists = await CategoryModel.findOne({
        $or: [{ name }, { slug }]
    });

    if (categoryExists) {
        return res.status(400).json({ error: "Category already exists." });
    }

    if (parent) {
        if (!mongoose.Types.ObjectId.isValid(parent)) {
            return res.status(400).json({ error: "Invalid parent category id." });
        }

        let parentCategory = await CategoryModel.findById(parent);

        if (!parentCategory) {
            return res.status(404).json({ error: "Parent category not found." });
        }
    }

    const image = req.file
        ? await uploadImage(req.file, "sasto-pasal/categories")
        : "";

    let category = await CategoryModel.create({
        name,
        slug,
        description,
        parent: parent || null,
        isActive: parseBoolean(req.body.isActive, true),
        image
    });

    res.status(201).send({
        message: "Category created successfully.",
        category
    });
};

exports.getCategories = async (req, res) => {
    const filter = {};

    if (req.query.active === "true") {
        filter.isActive = true;
    }

    if (req.query.active === "false") {
        filter.isActive = false;
    }

    if (req.query.parent) {
        filter.parent = req.query.parent === "root" ? null : req.query.parent;
    }

    let categories = await CategoryModel.find(filter)
        .populate("parent", "name slug")
        .sort({ name: 1 });

    res.send(categories);
};

exports.getCategory = async (req, res) => {
    let category = await CategoryModel.findById(req.params.id)
        .populate("parent", "name slug");

    if (!category) {
        return res.status(404).json({ error: "Category not found." });
    }

    res.send(category);
};

exports.updateCategory = async (req, res) => {
    let category = await CategoryModel.findById(req.params.id);

    if (!category) {
        return res.status(404).json({ error: "Category not found." });
    }

    const parent = normalizeParent(req.body.parent);

    if (parent && parent === req.params.id) {
        return res.status(400).json({ error: "Category cannot be its own parent." });
    }

    if (parent) {
        if (!mongoose.Types.ObjectId.isValid(parent)) {
            return res.status(400).json({ error: "Invalid parent category id." });
        }

        let parentCategory = await CategoryModel.findById(parent);

        if (!parentCategory) {
            return res.status(404).json({ error: "Parent category not found." });
        }
    }

    const nextName = req.body.name ? String(req.body.name).trim() : category.name;
    const nextSlug =
        req.body.slug || req.body.name
            ? makeSlug(req.body.slug || nextName)
            : category.slug;

    if (nextName !== category.name || nextSlug !== category.slug) {
        const duplicate = await CategoryModel.findOne({
            _id: { $ne: category._id },
            $or: [{ name: nextName }, { slug: nextSlug }]
        });

        if (duplicate) {
            return res.status(400).json({ error: "Category already exists." });
        }
    }

    category.name = nextName;
    category.slug = nextSlug;
    category.description = req.body.description ?? category.description;
    category.parent = parent === undefined ? category.parent : parent;
    category.isActive = parseBoolean(req.body.isActive, category.isActive);

    if (req.file) {
        category.image = await uploadImage(req.file, "sasto-pasal/categories");
    }

    await category.save();

    res.send({
        message: "Category updated successfully.",
        category
    });
};

exports.deleteCategory = async (req, res) => {
    let category = await CategoryModel.findById(req.params.id);

    if (!category) {
        return res.status(404).json({ error: "Category not found." });
    }

    let childCategory = await CategoryModel.findOne({ parent: category._id });

    if (childCategory) {
        return res.status(400).json({
            error: "Cannot delete a category that has subcategories."
        });
    }

    let productUsingCategory = await ProductModel.findOne({ category: category._id });

    if (productUsingCategory) {
        return res.status(400).json({
            error: "Cannot delete a category that has products."
        });
    }

    await CategoryModel.findByIdAndDelete(req.params.id);

    res.send({ message: "Category deleted successfully." });
};
