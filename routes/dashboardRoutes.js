const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const { auth, isAdmin, isSeller } = require("../middleware/auth");

router.get("/customer", auth, dashboardController.getCustomerDashboard);
router.get("/seller", auth, isSeller, dashboardController.getSellerDashboard);
router.get("/admin", auth, isAdmin, dashboardController.getAdminDashboard);

module.exports = router;
