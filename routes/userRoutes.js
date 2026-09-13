const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.post("/register", userController.register);
router.get("/verify/:token", userController.emailVerification);
router.post("/resend", userController.resendVerification);

router.post("/forgetpassword", userController.forgetPassword);
router.post("/resetpassword/:token", userController.resetPassword);

router.post("/login", userController.login);

router.get("/", userController.getUsersList);

router.put("/verify/:id", userController.verifyByAdmin);
router.put("/role/:id", userController.updateRole);

module.exports = router;