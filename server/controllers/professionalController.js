const Professional = require("../models/professionalModel");
const Shop = require("../models/shopModel");
const User = require("../models/clientModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

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
    const { userName, mobile, password, role, type, expert, email } = req.body;

    let professional = await Professional.findOne({ mobile: mobile });
    const shop = await Shop.findOne({ mobile: mobile });
    const user = await User.findOne({ mobile: mobile });

    if (professional || shop || user) {
      if (user) {
        return res.json({
          Status: false,
          message: "You have already have a client account using this number.",
        });
      }
      if (shop) {
        return res.json({
          Status: false,
          message: "You have already have a Shop account using this number.",
        });
      }
      return res.json({
        Status: false,
        message:
          "Mobile Number Already exists. Try logging in with this Mobile Number.",
      });
    }

    const hashedPassword = await securePassword(password);

    professional = await Professional.create({
      name: userName,
      mobile: mobile,
      password: hashedPassword,
      role: role,
      employmentType: type,
      expertise: expert,
      email: email,
      status: false,
    });

    if (professional) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "4khilharidas@gmail.com",
          pass: "bsqzewxygzkbnada",
        },
      });

      const mailOptions = {
        from: "4khilharidas@gmail.com",
        to: email,
        subject: "Welcome to BUILD DREAM community",
        text: `Dear ${userName}, you have requested to join our community. Please wait for the approval.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });

      const twilioClient = twilio(
        "AC30ef2a8d8904cb0fe50e26e1f2c3c325",
        "e43dbd9a91c0dc9f0472d8245e7d0d43"
      );

      twilioClient.messages
        .create({
          body: `Dear ${userName}, you have requested to join our community. Please wait for the approval.`,
          from: "+14508231866",
          to: `+91${mobile}`,
        })
        .then((message) => console.log("SMS sent:", message.sid))
        .catch((error) => console.error("Error sending SMS:", error));
    }

    res.json({
      status: true,
      message: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

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

    const professional = await Professional.findOne({ mobile: mobileNumber });
    if (!professional) {
      userLOGIN.message = "Your mobile number is wrong";
      res.send({ userLOGIN });
      return;
    }

    if (professional) {
      if (!professional.status) {
         userLOGIN.message = "Your account is not approved,wait please!";
         res.send({ userLOGIN });
         return;
      }
      const isMatch = await bcrypt.compare(password, professional.password);

      if (isMatch) {
        const token = jwt.sign({ id: professional._id }, "secretCode", {
          expiresIn: "30d",
        });
        userLOGIN.status = true;
        userLOGIN.name = professional.name;
        userLOGIN.token = token;
        userLOGIN.role = professional.role;

        const obj = {
          token,
          name: professional.name,
          role: professional.role,
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
