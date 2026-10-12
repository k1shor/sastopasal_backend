const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { auth, isAdmin } = require("../middleware/auth");

router.post("/register", userController.register);
router.get("/verify/:token", userController.emailVerification);
router.post("/resend", userController.resendVerification);

router.post("/forgetpassword", userController.forgetPassword);
router.post("/resetpassword/:token", userController.resetPassword);

router.post("/login", userController.login);

router.get("/",auth,isAdmin,userController.getUsersList);

router.put("/verify/:id",auth,isAdmin,userController.verifyByAdmin);

router.put("/role/:id",auth,isAdmin,userController.updateRole);
router.put("/seller-status/:id",auth,isAdmin,userController.updateSellerStatus);
// profile
router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, userController.updateProfile);

// admin delete user
router.delete("/:id", auth, isAdmin, userController.deleteUser);

module.exports = router;


