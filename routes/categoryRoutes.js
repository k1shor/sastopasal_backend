const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/categoryController");
const { auth, isAdmin } = require("../middleware/auth");

router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategory);

router.post("/", auth, isAdmin, categoryController.createCategory);
router.put("/:id", auth, isAdmin, categoryController.updateCategory);
router.delete("/:id", auth, isAdmin, categoryController.deleteCategory);

module.exports = router;
