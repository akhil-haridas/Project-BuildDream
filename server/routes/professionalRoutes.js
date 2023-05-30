const express = require("express");
const router = express.Router();
const professionalController = require("../controllers/professionalController")

router.post("/signup", professionalController.Signup);

module.exports = router;