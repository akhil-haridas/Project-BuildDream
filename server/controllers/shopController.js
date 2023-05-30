const Shop = require("../models/shopModel")
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
    const { userName, mobile, password, role, type, category,email } = req.body;

    let shop = await Shop.findOne({ mobile: mobile });

    if (shop) {
      return res.json({
        Status: false,
        message:
          "Mobile Number Already exists. Try Logging in with this Mobile Number.",
      });
    }

    const hashedPassword = await securePassword(password);

    shop = await Shop.create({
      name: userName,
      mobile: mobile,
      password: hashedPassword,
      role: role,
      businessType: type,
        category: category,
        email: email,
      status:false
    });

          if (shop) {
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
              text: `Hey ${userName}, you have requested to join our community. Please wait for the approval.`,
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
                body: `Hey ${userName}, you have requested to join our community. Please wait for the approval.`,
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
