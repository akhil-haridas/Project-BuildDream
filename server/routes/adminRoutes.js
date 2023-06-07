const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const multer = require("multer");

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



router.post("/login", adminController.Login);

router.get("/permissions", adminController.Permissions)

router.get('/allow-user/:id', adminController.allowUser)

router.get('/deny-user/:id', adminController.denyUser)

router.post('/addcategory', upload.single('image'), adminController.addCategory)

router.get('/getcategories', adminController.getCategories)

router.get("/removeCategory/:id", adminController.removeCategory);

router.get("/getclients", adminController.getClients);

router.get("/getclient?:id", adminController.getClient);

module.exports = router;
