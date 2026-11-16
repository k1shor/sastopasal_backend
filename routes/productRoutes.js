const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const { auth, isAdmin, isSeller } = require("../middleware/auth");

router.get("/", productController.getProducts);
router.get("/seller/my-products", auth, isSeller, productController.getSellerProducts);
router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/admin/all", auth, isAdmin, productController.getAllProductsAdmin);
router.get("/:id", productController.getProduct);

router.post("/", auth, isSeller, productController.createProduct);
router.put("/:id", auth, isSeller, productController.updateProduct);
router.delete("/:id", auth, isSeller, productController.deleteProduct);

router.put("/:id/stock", auth, isSeller, productController.updateStock);
router.put("/:id/availability", auth, isSeller, productController.updateAvailability);

router.delete("/admin/:id", auth, isAdmin, productController.adminDeleteProduct);

module.exports = router;
