const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Professional = require("../models/professionalModel");
const Shop = require("../models/shopModel");
const Category = require("../models/categoryModel");
const Clients = require("../models/clientModel");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

exports.Login = async (req, res) => {
  const adminMAIL = "admin@gmail.com";
  const adminPASS = await bcrypt.hash("admin@2000", 10);
  try {
    const { enteredEmail, enteredPassword } = req.body;

    const userLOGIN = {
      status: false,
      message: null,
      token: null,
      name: null,
      role: null,
    };

    if (enteredEmail != adminMAIL) {
      userLOGIN.message = "Email is wrong,please enter your email.";
      res.send({ userLOGIN });
      return;
    }

    const isMatch = await bcrypt.compare(enteredPassword, adminPASS);

    if (isMatch) {
      const token = jwt.sign({ id: "1234567890" }, "secretCode", {
        expiresIn: "30d",
      });
      userLOGIN.status = true;
      userLOGIN.name = "admin";
      userLOGIN.token = token;
      userLOGIN.role = "ADMIN";

      const obj = {
        token,
        name: "admin",
        role: "ADMIN",
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

exports.Permissions = async (req, res) => {
  const pros = await Professional.find({ status: "false" });
  const shops = await Shop.find({ status: "false" });
  const data = [...pros, ...shops];

  data.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });
  res.send({ data });
};

exports.allowUser = async (req, res) => {
  const userID = req.params.id;

  const professional = await Professional.findById({ _id: userID });

  const shop = await Shop.findById({ _id: userID });

  if (professional) {
    await Professional.findOneAndUpdate(
      { _id: userID },
      { $set: { status: "true" } }
    );
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "4khilharidas@gmail.com",
        pass: "bsqzewxygzkbnada",
      },
    });

    const mailOptions = {
      from: "4khilharidas@gmail.com",
      to: professional.email,
      subject: "Welcome to BUILD DREAM community",
      text: `Dear ${professional.name}, Welcome to BUILD DREM COMMUNITY , your account has been approved.Explore with us...`,
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
        body: `Dear ${professional.name}, you have requested to join our community. Please wait for the approval.`,
        from: "+14508231866",
        to: `+91${professional.mobile}`,
      })
      .then((message) => console.log("SMS sent:", message.sid))
      .catch((error) => console.error("Error sending SMS:", error));
    return res.status(200).send({ message: "Document updated successfully" });
  }
  if (shop) {
    await Shop.findOneAndUpdate({ _id: userID }, { $set: { status: "true" } });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "4khilharidas@gmail.com",
        pass: "bsqzewxygzkbnada",
      },
    });

    const mailOptions = {
      from: "4khilharidas@gmail.com",
      to: shop.email,
      subject: "Welcome to BUILD DREAM community",
      text: `Dear ${shop.name}, Welcome to BUILD DREM COMMUNITY , your account has been approved.Explore with us...`,
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
        body: `Dear ${shop.name},Welcome to BUILD DREM COMMUNITY , your account has been approved.Explore with us...`,
        from: "+14508231866",
        to: `+91${shop.mobile}`,
      })
      .then((message) => console.log("SMS sent:", message.sid))
      .catch((error) => console.error("Error sending SMS:", error));
    return res.status(200).send({ message: "Document updated successfully" });
  }

  return res.status(404).send({ message: "Document not found" });
};

exports.denyUser = async (req, res) => {
  const userID = req.params.id;

  const professional = await Professional.findById({ _id: userID });

  const shop = await Shop.findById({ _id: userID });

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
      to: professional.email,
      subject: "BUIL DREAM COMMUNITY",
      text: `Dear ${professional.name}, Sorry for the inconvenience, your Request was declined by admin.`,
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
        body: `Dear ${professional.name},Sorry for the inconvenience, your Request was declined by admin.`,
        from: "+14508231866",
        to: `+91${professional.mobile}`,
      })
      .then((message) => console.log("SMS sent:", message.sid))
      .catch((error) => console.error("Error sending SMS:", error));
    await Professional.findByIdAndDelete({ _id: userID });
    return res.status(200).send({ message: "Document updated successfully" });
  }
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
      to: shop.email,
      subject: "BUILD DREAM COMMUNITY",
      text: `Dear ${shop.name}, Sorry for the inconvenience, your Request was declined by admin.`,
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
        body: `Dear ${shop.name},Sorry for the inconvenience, your Request was declined by admin.`,
        from: "+14508231866",
        to: `+91${shop.mobile}`,
      })
      .then((message) => console.log("SMS sent:", message.sid))
      .catch((error) => console.error("Error sending SMS:", error));
    await Shop.findOneAndDelete({ _id: userID });
    return res.status(200).send({ message: "Document updated successfully" });
  }

  return res.status(404).send({ message: "Document not found" });
};

exports.addCategory = async (req, res) => {
  try {
    const { category, role } = req.body;
    const image = req.file;
    const unique = await Category.findOne({
      name: { $regex: category, $options: "i" },
    });

    if (!unique) {
      await Category.create({
        name: category,
        image: image.filename,
        role: role,
      });
      res.json({
        status: true,
        message: null,
      });
    } else {
      res.json({
        Status: false,
        message: "Category already exist",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categoryDATA = await Category.find({});

    res.send({ categoryDATA });
  } catch (error) {
    console.log(error.message);
  }
};

exports.removeCategory = async (req, res) => {
  try {
    const categoryID = req.params.id;
    const deleteData = await Category.deleteOne({ _id: categoryID });
    return res.status(200).send({ message: "category deleted successfully" });
  } catch (error) {
    console.log(error);
  }
};

exports.getClients = async (req, res) => {
  try {
    const data = await Clients.find({});
    console.log(data);
    res.send({ data });
  } catch (error) {
    console.log(error);
  }
};

exports.getClient = async (req, res) => {
  try {
    const clientID = req.query.id;
    const DATA = await Clients.findById({ _id: clientID });
    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};
