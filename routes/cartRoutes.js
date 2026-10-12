const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const { auth } = require("../middleware/auth");

router.get("/", auth, cartController.getCart);
router.post("/items", auth, cartController.addToCart);
router.put("/items/:productId", auth, cartController.updateCartItem);
router.delete("/items/:productId", auth, cartController.removeCartItem);
router.delete("/", auth, cartController.clearCart);
router.post("/coupon", auth, cartController.applyCoupon);

module.exports = router;
