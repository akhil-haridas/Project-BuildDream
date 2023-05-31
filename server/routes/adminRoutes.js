const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/login", adminController.Login);
router.get("/permissions", adminController.Permissions)
router.get('/allow-user/:id', adminController.allowUser)
router.get('/deny-user/:id',adminController.denyUser)

module.exports = router;
