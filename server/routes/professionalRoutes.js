const express = require("express");
const router = express.Router();
const professionalController = require("../controllers/professionalController")
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


router.post("/signup",professionalController.Signup);

router.post("/login",professionalController.Login)

router.post("/addWork", upload.single("image"), authJWT,professionalController.addWork);

router.post("/process-payment",professionalController.processPayment);

router.get("/getcategories",professionalController.getCategories);

router.get('/verify-email/:token',professionalController.verifyEmail);

router.get("/getdetails", authJWT,professionalController.getDetails);

router.post("/generaledit",upload.single("image"), authJWT,professionalController.generalEdit);

router.post("/infoedit", authJWT,professionalController.infoEdit);

router.post("/changepass", authJWT,professionalController.changePass);

router.post("/socialedit", authJWT,professionalController.socialEdit);

module.exports = router;