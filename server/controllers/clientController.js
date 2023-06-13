const User = require("../models/clientModel");
const Professional = require("../models/professionalModel");
const Shop = require("../models/shopModel");
const Category = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Secure Password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    throw new Error("Error while hashing password");
  }
};

//client Signup

exports.Signup = async (req, res) => {
  try {
    const { userName, mobile, password, role } = req.body;
    const image = req.file;

    let user = await User.findOne({ mobile: mobile });
    const professional = await Professional.findOne({ mobile: mobile });
    const shop = await Shop.findOne({ mobile: mobile });
    if (user || professional || shop) {
      if (professional) {
        return res.json({
          Status: false,
          message:
            "You have already have a professional account using this number.",
        });
      }
      if (shop) {
        return res.json({
          Status: false,
          message: "You have already have a shop account using this number.",
        });
      }
      return res.json({
        Status: false,
        message:
          "Mobile Number Already exists. Try logging in with this Mobile Number.",
      });
    }

    const hashedPassword = await securePassword(password);

    user = await User.create({
      name: userName,
      mobile: mobile,
      password: hashedPassword,
      image: image.filename,
      role: role,
    });

    res.json({
      status: true,
      message: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// client Login

exports.Login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    const userLOGIN = {
      status: false,
      message: null,
      token: null,
      name: null,
      role: null,
    };

    const user = await User.findOne({ mobile: mobileNumber });
    const professional = await Professional.findOne({ mobile: mobileNumber });
    const shop = await Shop.findOne({ mobile: mobileNumber });
    if (!user) {
      userLOGIN.message = "Your mobile number is wrong";
      res.send({ userLOGIN });
      return;
    }

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = jwt.sign({ id: user._id }, "secretCode", {
          expiresIn: "30d",
        });
        userLOGIN.status = true;
        userLOGIN.name = user.name;
        userLOGIN.token = token;
        userLOGIN.role = user.role;

        const obj = {
          token,
          name: user.name,
          role: user.role,
        };

        res
          .cookie("jwt", obj, {
            httpOnly: false,
            maxAge: 6000 * 1000,
          })
          .status(200)
          .send({ userLOGIN });
      } else {
        userLOGIN.message = "Password is wrong";
        res.send({ userLOGIN });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

//My Acccount

exports.MyAccount = async (req, res) => {
  if (req.cookies.jwt && req.cookies.jwt.token) {
    try {
      const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
      const user = await User.findOne({ _id: jwtToken.id });
      if (user) {
        res.status(200).send({ user });
      } else {
        res.status(500).send({ error: "User not found" });
      }
    } catch (err) {
      res.status(401).send({ error: "Invalid JWT token" });
    }
  } else {
    res.status(401).send({ error: "JWT token not found in cookies" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;

    const userRESET = {
      status: false,
      message: null,
    };
    const user = await User.findOne({ mobile: mobile });

    if (!user) {
      userRESET.message = "You are no longer a member";
      res.send({ userRESET });
      return;
    } else {
      userRESET.status = true
      res.send({ userRESET });
    }


  } catch (error) {
    console.log(error.message);
  }
};

//Reset Password

exports.Resetpass = async (req, res) => {
  try {
    const { newpass, mobile } = req.body;

    const userRESET = {
      status: false,
      message: null,
    };

    const user = await User.findOne({ mobile: mobile });

    const password = await securePassword(newpass);

    user.password = password;

    const updatedUser = await user.save();

    userRESET.status = true;
    userRESET.message = "Password reset successful";
    res.send({ userRESET });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

exports.GetProfessionals = async (req, res) => {
  try {
    const DATA = await Professional.find({ status: true });
    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};

exports.GetProfessional = async (req, res) => {
  try {
    const id = req.query.id;
    const DATA = await Professional.findById({ _id: id });
    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};

exports.GetShops = async (req, res) => {
  try {
    const DATA = await Shop.find({ status: true });
    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};

exports.GetShop = async (req, res) => {
  try {
    const id = req.query.id;
    const DATA = await Shop.findById({ _id: id });
    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const proDATA = await Category.find({ role: "PROFESSIONAL" });
    const shopDATA = await Category.find({ role: "SHOP" });
    res.send({ proDATA, shopDATA });
  } catch (error) {}
};

exports.getLocation = async (req, res) => {
  try {
    Professional.find({}, "location district")
      .then((professionals) => {
        const locationsAndDistricts = professionals.map((professional) => {
          return {
            location: professional.location,
            district: professional.district,
          };
        });

        res.send({ locationsAndDistricts });
      })
      .catch((err) => {
        console.error(err);
      });
  } catch (error) {
    console.log(error);
  }
};

exports.getLocations = async (req, res) => {
  try {
    Shop.find({}, "location district")
      .then((professionals) => {
        const locationsAndDistricts = professionals.map((professional) => {
          return {
            location: professional.location,
            district: professional.district,
          };
        });

        res.send({ locationsAndDistricts });
      })
      .catch((err) => {
        console.error(err);
      });
  } catch (error) {
    console.log(error);
  }
};
