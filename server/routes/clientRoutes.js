const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
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

router.post("/signup", upload.single('image'),clientController.Signup);

router.post('/login',clientController.Login)

router.get('/myaccount',authJWT,clientController.MyAccount)

router.post('/forgotpassword',clientController.forgotPassword)

router.post('/resetpass',clientController.Resetpass)

router.get('/professionals',clientController.GetProfessionals)

router.get("/professional?:id",clientController.GetProfessional);

router.get("/shops",clientController.GetShops);

router.get("/shop?:id",clientController.GetShop);

router.get("/getcategories",clientController.getCategories);

router.get("/getlocations", clientController.getLocation);

router.get("/getlocationss", clientController.getLocations);

router.post("/chat", clientController.getChat);

router.get("/chat", clientController.accessChat);

router.post("/message",clientController.sendMessage)

router.get("/message?:id",clientController.allMessages)

module.exports = router;
