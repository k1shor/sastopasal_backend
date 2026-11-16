const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const { auth, isAdmin } = require("../middleware/auth");

router.post("/", auth, orderController.createOrder);
router.get("/my-orders", auth, orderController.getMyOrders);
router.get("/admin/all", auth, isAdmin, orderController.getAllOrders);
router.get("/admin/report", auth, isAdmin, orderController.getSalesReport);
router.get("/:id", auth, orderController.getOrderDetails);
router.put("/:id/status", auth, isAdmin, orderController.updateOrderStatus);
router.put("/:id/payment", auth, isAdmin, orderController.updatePaymentStatus);
router.put("/:id/cancel", auth, orderController.cancelOrder);

module.exports = router;
