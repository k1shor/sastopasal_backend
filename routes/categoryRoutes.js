const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/categoryController");
const { auth, isAdmin } = require("../middleware/auth");
const upload = require("../middlewares/fileUpload");
const { categoryRules, categoryUpdateRules, validate } = require("../middlewares/validations");

router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategory);

router.post(
    "/",
    auth,
    isAdmin,
    upload.single("image"),
    categoryRules,
    validate,
    categoryController.createCategory
);

router.put(
    "/:id",
    auth,
    isAdmin,
    upload.single("image"),
    categoryUpdateRules,
    validate,
    categoryController.updateCategory
);

router.delete("/:id", auth, isAdmin, categoryController.deleteCategory);

module.exports = router;
