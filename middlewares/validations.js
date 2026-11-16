const mongoose = require("mongoose");
const fs = require("fs");
const { check, validationResult } = require("express-validator");
const { collectUploadedFiles } = require("../utils/uploadImages");

const isUnsetParent = (value) => {
    return ["", "null", "undefined"].includes(String(value).trim());
};

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    // Do not leave temporary uploads behind when the request is rejected.
    collectUploadedFiles(req).forEach((file) => {
        fs.unlink(file.path, () => {});
    });

    return res.status(400).json({
        error: errors.array()[0].msg
    });
};

const categoryRules = [
    check("name", "Category name is required.")
        .trim()
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Category name must be at least 3 characters."),

    check("slug")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ min: 3 })
        .withMessage("Category slug must be at least 3 characters."),

    check("parent")
        .optional({ values: "falsy" })
        .custom((value) => {
            if (isUnsetParent(value)) {
                return true;
            }

            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error("Parent category must be a valid MongoDB id.");
            }

            return true;
        }),

    check("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be true or false.")
];

const categoryUpdateRules = [
    check("name")
        .optional()
        .trim()
        .isLength({ min: 3 })
        .withMessage("Category name must be at least 3 characters."),

    check("slug")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ min: 3 })
        .withMessage("Category slug must be at least 3 characters."),

    check("parent")
        .optional({ values: "falsy" })
        .custom((value) => {
            if (isUnsetParent(value)) {
                return true;
            }

            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error("Parent category must be a valid MongoDB id.");
            }

            return true;
        }),

    check("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be true or false.")
];

const productRules = [
    check("name", "Product name is required.")
        .trim()
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Product name must be at least 3 characters."),

    check("description", "Product description is required.")
        .trim()
        .notEmpty()
        .isLength({ min: 15 })
        .withMessage("Description must be at least 15 characters."),

    check("price", "Product price is required.")
        .notEmpty()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number."),

    check("category", "Category is required.")
        .notEmpty()
        .isMongoId()
        .withMessage("Category must be a valid MongoDB id."),

    check("brand")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Brand must be text."),

    check("stock")
        .optional({ values: "falsy" })
        .isInt({ min: 0 })
        .withMessage("Stock must be a whole number greater than or equal to 0."),

    check("productType")
        .optional()
        .isIn(["new", "used"])
        .withMessage("Product type must be either new or used."),

    check("usedCondition")
        .if((value, { req }) => req.body.productType === "used")
        .notEmpty()
        .withMessage("Used products must include usedCondition.")
        .isIn(["like_new", "excellent", "good", "fair"])
        .withMessage("Used condition must be like_new, excellent, good, or fair."),

    check("productAge")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Product age must be text."),

    check("defects")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Defects must be text."),

    check("isAvailable")
        .optional()
        .isBoolean()
        .withMessage("isAvailable must be true or false.")
];

const productUpdateRules = [
    check("name")
        .optional()
        .trim()
        .isLength({ min: 3 })
        .withMessage("Product name must be at least 3 characters."),

    check("description")
        .optional()
        .trim()
        .isLength({ min: 15 })
        .withMessage("Description must be at least 15 characters."),

    check("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number."),

    check("category")
        .optional()
        .isMongoId()
        .withMessage("Category must be a valid MongoDB id."),

    check("brand")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Brand must be text."),

    check("stock")
        .optional({ values: "falsy" })
        .isInt({ min: 0 })
        .withMessage("Stock must be a whole number greater than or equal to 0."),

    check("productType")
        .optional()
        .isIn(["new", "used"])
        .withMessage("Product type must be either new or used."),

    check("usedCondition")
        .optional({ values: "falsy" })
        .isIn(["like_new", "excellent", "good", "fair"])
        .withMessage("Used condition must be like_new, excellent, good, or fair."),

    check("productAge")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Product age must be text."),

    check("defects")
        .optional({ values: "falsy" })
        .isString()
        .withMessage("Defects must be text."),

    check("isAvailable")
        .optional()
        .isBoolean()
        .withMessage("isAvailable must be true or false.")
];

module.exports = {
    validate,
    categoryRules,
    categoryUpdateRules,
    productRules,
    productUpdateRules
};
