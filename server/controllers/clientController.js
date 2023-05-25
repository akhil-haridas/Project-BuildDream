const User = require("../models/clientModel");
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
    const { userName, mobile, password,role } = req.body;
    const image = req.file;
    
    let user = await User.findOne({ mobile: mobile });

    if (user) {
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
    };

    const user = await User.findOne({ mobile: mobileNumber });
    if (!user) {
      userLOGIN.message = "Your mobile number is wrong";
      res.send({ userLOGIN });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, "secretCode", {
        expiresIn: "30d",
      });
      userLOGIN.status = true;
      userLOGIN.name = user.name;
      userLOGIN.token = token;

      const obj = {
        token,
        name: user.name,
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
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
