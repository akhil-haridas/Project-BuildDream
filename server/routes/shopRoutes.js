const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");
const multer = require("multer");
const authJWT = require("../middlewares/authJWT");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

router.post("/signup",shopController.Signup);

router.post("/login", shopController.Login)

router.post("/addProduct", upload.single("image"), authJWT,shopController.addProduct);

router.post("/process-payment",shopController.processPayment);

router.get("/getcategories", shopController.getCategories);

router.get("/verify-email/:token",shopController.verifyEmail);

router.get("/getdetailss", authJWT,shopController.getDetailss);

router.post("/generaledit", upload.single("image"), authJWT,shopController.generalEdit);

router.post("/infoedit", authJWT,shopController.infoEdit);

router.post("/changepass", authJWT,shopController.changePass);

router.post("/socialedit", authJWT,shopController.socialEdit);

module.exports = router;
