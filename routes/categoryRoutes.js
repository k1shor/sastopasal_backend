const express = require("express");

const { addCategory, getAllCategories, getCategoryDetails, updateCategory, deleteCategory } = require("../controllers/categoryController");

const upload = require("../middlewares/fileUpload");

const { categoryAddRules,validate,  categoryUpdateRules } = require("../middlewares/validations");

const router = express.Router();

router.post('/addcategory', upload.single("category_image"), categoryAddRules, validate, addCategory)
router.get("/getallcategories", getAllCategories)
router.get("/getcategorydetails/:id", getCategoryDetails);
router.put("/updatecategory/:id", upload.single("category_image"), categoryUpdateRules, validate, updateCategory);
router.delete("/deletecategory/:id", deleteCategory);

module.exports = router
