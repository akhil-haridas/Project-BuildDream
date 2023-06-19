const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Professional = require("../models/professionalModel");
const Shop = require("../models/shopModel");
const Subscription = require("../models/subscriptionModel");
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
  // mongodb aggregation
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

exports.getProfessionals = async (req, res) => {
  try {
    const data = await Professional.find({});
    res.send({ data });
  } catch (error) {
    console.log(error);
  }
};

exports.getProfessional = async (req, res) => {
  try {
    const proID = req.query.id;
    const DATA = await Professional.findById({ _id: proID });
    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};

exports.getShops = async (req, res) => {
  try {
    const data = await Shop.find({});
    res.send({ data });
  } catch (error) {
    console.log(error);
  }
};

exports.getShop = async (req, res) => {
  try {
    const proID = req.query.id;
    const DATA = await Shop.findById({ _id: proID });
    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};

exports.blockClient = async (req, res) => {
  try {
    const clientID = req.params.id;
    const client = await Clients.findById(clientID);
    if (client.block) {
      client.block = false;
      await client.save();
    } else {
      client.block = true;
      await client.save();
    }
    res.send({ status: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      status: false,
      message: "An error occurred while blocking/unblocking the client",
    });
  }
};

exports.blockProfessional = async (req, res) => {
  try {
    const professionalID = req.params.id;
    const professional = await Professional.findById(professionalID);
    if (professional.block) {
      professional.block = false;
      await professional.save();
    } else {
      professional.block = true;
      await professional.save();
    }
    res.send({ status: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      status: false,
      message: "An error occurred while blocking/unblocking the professional",
    });
  }
};

exports.blockShop = async (req, res) => {
  try {
    const shopID = req.params.id;
    const shop = await Shop.findById(shopID);
    if (shop.block) {
      shop.block = false;
      await shop.save();
    } else {
      shop.block = true;
      await shop.save();
    }
    res.send({ status: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      status: false,
      message: "An error occurred while blocking/unblocking the shop",
    });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate({
        path: "user",
        populate: {
          path: "Professional", // For Professional userType
          model: "Professional",
          select: "name email",
        },
      })
      .populate({
        path: "user",
        populate: {
          path: "Shop", // For Shop userType
          model: "Shop",
          select: "name email",
        },
      })
      .exec();

    res.json({ subscriptions });
  } catch (error) {
    console.log(error.message);
  }
};
