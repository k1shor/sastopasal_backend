const express = require("express");
const router = express.Router();

const posProductcontroller = require("../controllers/posProductController");
const { auth, isSeller } = require("../middleware/auth");

router.get("/", auth, isSeller, posProductcontroller.getPosProducts);

module.exports = router;
