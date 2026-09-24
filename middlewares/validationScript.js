const { check, validationResult } = require('express-validator');

exports.productAddRules = [

    // Product Name
    check('product_name', "Product name is required.")
        .notEmpty()
        .isLength({ min: 3 })
        .withMessage("Product name must be at least 3 characters"),

    // Product Description
    check('product_description', "Product description is required.")
        .notEmpty()
        .isLength({ min: 15 })
        .withMessage("Description must be at least 15 characters"),

    // Product Brand
    check('product_brand', "Product brand is required.")
        .notEmpty()
        .isLength({ min: 2 })
        .withMessage("Product brand must be at least 2 characters"),

    // Product Price
    check('product_price', "Product price is required.")
        .notEmpty()
        .isNumeric()
        .withMessage("Price must be a number"),

    // Category
    check('category', "Category is required.")
        .optional()
        .isMongoId()
        .withMessage("Category must be a MongoDB ID"),

    // Sub Category
    check('subCategory')
        .optional()
        .isMongoId()
        .withMessage("Sub Category must be a MongoDB ID"),

    // Count in Stock
    check('count_in_stock', "Count in stock is required.")
        .notEmpty()
        .isNumeric()
        .withMessage("Count must be a number.")
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error('Count in stock cannot be negative');
            }
            return true;
        }),

    // Product Condition
    check('product_condition', "Product condition is required")
        .notEmpty()
        .isIn(['New', 'Used'])
        .withMessage("Product condition must be either New or Used"),

    // Product Status
    check('product_status')
        .optional()
        .isIn(['Active', 'Inactive'])
        .withMessage('Product status must be either Active or Inactive'),

    // Used Product Condition
    check('usedCondition')
        .optional()
        .isIn(['Like New', 'Excellent', 'Good', 'Fair'])
        .withMessage('Used condition must be Like New, Excellent, Good, or Fair'),

    // Product Age
    check('productAge')
        .optional()
        .isNumeric()
        .withMessage('Product age must be a number')
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error('Product age cannot be negative');
            }
            return true;
        }),

    // Defects
    check('defects')
        .optional()
        .isString()
        .withMessage('Defects must be text'),

    // Repair History
    check('repairHistory')
        .optional()
        .isString()
        .withMessage('Repair history must be text'),

    // Accessories
    check('accessories')
        .optional()
        .isString()
        .withMessage('Accessories must be text')
];


exports.validate = async (req, res, next) => {

    const errors = validationResult(req);

    if (errors.isEmpty()) {
        next();
    } else {
        return res.status(400).json({
            error: errors.array()[0].msg
        });
    }
};

