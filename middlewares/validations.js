const {check, validationResult} = require('express-validator')

exports.categoryAddRules = [
    check('category_name', "Category name is required").notEmpty()
        .isLength({min:3}).withMessage("Category must be atleast 3 characters")
]

exports.categoryUpdateRules = [
    check('category_name').optional()
         .isLength({min:3}).withMessage("Category must be atleast 3 characters")
]

exports.validate = (req, res, next) => {
    let errors = validationResult(req)
    if(errors.isEmpty()){
        next()
    }
    else{
        return res.status(400).json({
            error: errors.array()[0].msg
        })
    }
}