const CategoryModel = require("../models/categoryModel");
const ProductModel = require("../models/productModel");

const makeSlug = (value) => {
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

exports.createCategory = async (req, res) => {
    const { name, description, parent, isActive } = req.body;

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
        let parentCategory = await CategoryModel.findById(parent);

        if (!parentCategory) {
            return res.status(404).json({ error: "Parent category not found." });
        }
    }

    let category = await CategoryModel.create({
        name,
        slug,
        description,
        parent: parent || null,
        isActive: isActive ?? true
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

    if (req.body.parent && req.body.parent === req.params.id) {
        return res.status(400).json({ error: "Category cannot be its own parent." });
    }

    if (req.body.parent) {
        let parentCategory = await CategoryModel.findById(req.body.parent);

        if (!parentCategory) {
            return res.status(404).json({ error: "Parent category not found." });
        }
    }

    category.name = req.body.name || category.name;
    category.description = req.body.description ?? category.description;
    category.parent = req.body.parent === undefined ? category.parent : req.body.parent || null;
    category.isActive = req.body.isActive ?? category.isActive;

    if (req.body.slug || req.body.name) {
        category.slug = makeSlug(req.body.slug || req.body.name);
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
