const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");

router.post("/signup", shopController.Signup);
router.post("/login",shopController.Login)

module.exports = router;
