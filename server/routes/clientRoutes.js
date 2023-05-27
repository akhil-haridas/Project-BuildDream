const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/clients");
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

router.post("/signup", upload.single('image'), clientController.Signup);

router.post('/login', clientController.Login)

router.get('/myaccount',clientController.MyAccount)

router.post('/resetpass',clientController.Resetpass)

module.exports = router;
