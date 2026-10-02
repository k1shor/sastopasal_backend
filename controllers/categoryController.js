const mongoose = require("mongoose");
const CategoryModel = require("../models/categoryModel");
const cloudinary = require("../config/cloudinary");

//add category
exports.addCategory = async (req, res) => {
    try {
        // Check if category already exists
        const categoryExists = await CategoryModel.findOne({
            category_name: req.body.category_name
        });

        if (categoryExists) {
            return res.status(400).json({
                error: "Category already exists"
            });
        }

        // Check parent category
        let parentCategory = null;

        if (
            req.body.parent_category &&
            req.body.parent_category !== "null" &&
            req.body.parent_category !== "undefined"
        ) {
            // Validate ObjectId
            if (
                !mongoose.Types.ObjectId.isValid(
                    req.body.parent_category
                )
            ) {
                return res.status(400).json({
                    error: "Invalid parent category ID"
                });
            }

            // Find parent category
            parentCategory = await CategoryModel.findById(
                req.body.parent_category
            );

            if (!parentCategory) {
                return res.status(404).json({
                    error: "Parent category not found"
                });
            }
        }

        // Image
        let categoryImage = "";

        if (req.file) {

            const uploadedImage =
                await cloudinary.uploader.upload(
                    req.file.path,
                    {
                        folder: "sasto-pasal/categories"
                    }
                );

            categoryImage =
                uploadedImage.secure_url;
        }

        // Create category
        const categoryToAdd = await CategoryModel.create({
            category_name: req.body.category_name,

            category_image: categoryImage,

            parent_category: parentCategory
                ? parentCategory._id
                : null,

            is_active:
                req.body.is_active !== undefined
                    ? req.body.is_active
                    : true
        });

        return res.status(201).json({
            categoryToAdd,
            message: "Category added successfully"
        });

    } catch (error) {
        console.error("Add category error:", error);

        return res.status(500).json({
            error: "Something went wrong",
            message: error.message
        });
    }
};


//get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryModel
            .find()
            .populate("parent_category", "category_name");

        return res.status(200).json(categories);

    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            error: "Something went wrong",
            message: error.message
        });
    }
};


//get category details
exports.getCategoryDetails = async (req, res) => {
    try {
        const category = await CategoryModel
            .findById(req.params.id)
            .populate("parent_category", "category_name");

        if (!category) {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        // Find child categories
        const children = await CategoryModel.find({
            parent_category: category._id
        });

        return res.status(200).json({
            category: category,
            children: children
        });

    } catch (error) {
        console.error("Get category error:", error);

        return res.status(500).json({
            error: "Something went wrong",
            message: error.message
        });
    }
};


//update category
exports.updateCategory = async (req, res) => {
    try {
        const category = await CategoryModel.findById(
            req.params.id
        );

        if (!category) {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        // Check duplicate category name
        if (
            req.body.category_name &&
            req.body.category_name !== category.category_name
        ) {
            const categoryExists = await CategoryModel.findOne({
                category_name: req.body.category_name,
                _id: { $ne: req.params.id }
            });

            if (categoryExists) {
                return res.status(400).json({
                    error: "Category already exists"
                });
            }
        }

        // Parent category handling
        if (req.body.parent_category !== undefined) {

            // Allow null or empty string to make it a main category
            if (
                req.body.parent_category !== null &&
                req.body.parent_category !== "" &&
                req.body.parent_category !== "null"
            ) {
                // Validate ObjectId
                if (
                    !mongoose.Types.ObjectId.isValid(
                        req.body.parent_category
                    )
                ) {
                    return res.status(400).json({
                        error: "Invalid parent category ID"
                    });
                }

                // Category cannot be its own parent
                if (
                    req.body.parent_category.toString() ===
                    req.params.id.toString()
                ) {
                    return res.status(400).json({
                        error: "Category cannot be its own parent"
                    });
                }

                // Check parent exists
                const parentCategory =
                    await CategoryModel.findById(
                        req.body.parent_category
                    );

                if (!parentCategory) {
                    return res.status(404).json({
                        error: "Parent category not found"
                    });
                }

                category.parent_category =
                    req.body.parent_category;

            } else {
                category.parent_category = null;
            }
        }

        // Update category name
        if (req.body.category_name) {
            category.category_name =
                req.body.category_name;
        }

        // Update active status
        if (req.body.is_active !== undefined) {
            category.is_active = req.body.is_active;
        }

        // Update image
         if (req.file) {

            const uploadedImage =
                await cloudinary.uploader.upload(
                    req.file.path,
                    {
                        folder:
                            "sasto-pasal/categories"
                    }
                );


            category.category_image =
                uploadedImage.secure_url;
        }

        // Save category
        const categoryToUpdate = await category.save();

        return res.status(200).json({
            categoryToUpdate,
            message: "Category updated successfully"
        });

    } catch (error) {
        console.error("Update category error:", error);

        return res.status(500).json({
            error: "Something went wrong",
            message: error.message
        });
    }
};


//delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category =
            await CategoryModel.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        // Check whether category has children
        const children = await CategoryModel.find({
            parent_category: category._id
        });

        if (children.length > 0) {
            return res.status(400).json({
                error:
                    "Cannot delete category because it has child categories"
            });
        }

        // Delete category
        const deletedCategory =
            await CategoryModel.findByIdAndDelete(
                req.params.id
            );

        return res.status(200).json({
            deletedCategory,
            message: "Category deleted successfully"
        });

    } catch (error) {
        console.error("Delete category error:", error);

        return res.status(500).json({
            error: "Something went wrong",
            message: error.message
        });
    }
};