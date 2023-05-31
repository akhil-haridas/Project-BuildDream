const express = require("express");
const router = express.Router();
const professionalController = require("../controllers/professionalController")

router.post("/signup", professionalController.Signup);
router.post("/login",professionalController.Login)

module.exports = router;