const express = require("express");
const router = express.Router();

const posCartController = require("../controllers/pos/posCartController");
const { auth, isSeller } = require("../../middleware/auth");

router.get("/cart", auth, isSeller, posCartController.getCart);
router.post("/cart/items", auth, isSeller, posCartController.addToCart);
router.put(
  "/cart/items/:productId",
  auth,
  isSeller,
  posCartController.updateCartItem,
);
router.delete(
  "/cart/items/:productId",
  auth,
  isSeller,
  posCartController.removeCartItem,
);
router.delete("/cart", auth, isSeller, posCartController.clearCart);

module.exports = router;
