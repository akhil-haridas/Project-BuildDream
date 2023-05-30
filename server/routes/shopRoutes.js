const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");

router.post("/signup", shopController.Signup);

module.exports = router;
