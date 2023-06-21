const Professional = require("../models/professionalModel");
const Shop = require("../models/shopModel");
const User = require("../models/clientModel");
const Category = require("../models/categoryModel");
const Subscription = require("../models/subscriptionModel");
const bcrypt = require("bcrypt");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

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

//shop Signup

exports.Signup = async (req, res) => {
  try {
    const { userName, location, password, role, district, category, email } =
      req.body;

    let shop = await Shop.findOne({ email: email });
    const professional = await Professional.findOne({ email: email });
    const user = await User.findOne({ email: email });

    if (professional || shop || user) {
      if (user) {
        return res.json({
          Status: false,
          message: "You have already have a client account using this email.",
        });
      }
      if (professional) {
        return res.json({
          Status: false,
          message:
            "You have already have a Professional account using this email.",
        });
      }

      return res.json({
        Status: false,
        message:
          "Mobile Number Already exists. Try Logging in with this Mobile Number.",
      });
    }

    const hashedPassword = await securePassword(password);
    const verificationToken = uuidv4();

    shop = await Shop.create({
      name: userName,
      location: location,
      password: hashedPassword,
      role: role,
      district: district,
      category: category,
      email: email,
      status: false,
      verify: false,
      verifyToken: verificationToken,
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
        html: `
    <p>Dear ${userName},</p>
    <p>You have requested to join our community. Please click the link below to verify your email:</p>
    <a href="http://localhost:4000/shop/verify-email/${verificationToken}">Verify Email</a>
    <p>If you did not request to join our community, you can ignore this email.</p>
  `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
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

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await Shop.findOne({ verifyToken: token });

    if (!user) {
      return res.send("verification failed");
    }

    user.verified = true;
    user.verifyToken = null;
    await user.save();

    // Redirect the user to a success page
    res.send("verification-success"); //
  } catch (error) {
    console.log(error);
  }
};

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userLOGIN = {
      status: false,
      message: null,
      token: null,
      name: null,
      role: null,
      plan: false,
      id: null,
    };

    let active = false;

    const shop = await Shop.find({ email: email });
    if (!shop) {
      userLOGIN.message = "Your email is wrong";
      res.send({ userLOGIN });
      return;
    }

    if (!shop[0].verified) {
      userLOGIN.message =
        "Your Email  is not verified ,please verify your mail";
      res.send({ userLOGIN });
      return;
    }

    if (!shop[0].status) {
      userLOGIN.message = "Your account is not approved,wait please!";
      res.send({ userLOGIN });
      return;
    }
        if (shop[0]?.block) {
          userLOGIN.message = "Your are blocked by admin";
          res.send({ userLOGIN });
          return;
        }

    const member = await Subscription.findOne({ user: shop[0]._id });
    if (member) {
      const currentDate = new Date();
      const expiryDate = new Date(member.expiry);

      if (expiryDate < currentDate) {
        active = false;
        console.log("Subscription has expired");
      } else {
        active = true;
        console.log("Subscription is still active");
      }
    }

    const isMatch = await bcrypt.compare(password, shop[0].password);

    if (isMatch) {
      const token = jwt.sign({ id: shop[0]._id }, "secretCode", {
        expiresIn: "30d",
      });
      userLOGIN.status = true;
      userLOGIN.name = shop[0].name;
      userLOGIN.token = token;
      userLOGIN.role = shop[0].role;
      userLOGIN.plan = active;
      userLOGIN.id = shop[0]._id;

      const obj = {
        token,
        name: shop[0].name,
        role: shop[0].role,
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

exports.addProduct = async (req, res) => {
  try {
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const { name, price } = req.body;
    const image = req.file;

    const shopId = jwtToken.id;

    const product = {
      name,
      price,
      image: image.filename,
    };

    // Find the shop by ID and update the products array
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      { $push: { products: product } },
      { new: true }
    );

    res.status(200).send({ added: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.processPayment = async (req, res) => {
  try {
    const { token, amount, currency, userid } = req.body;
    const userType = "Shop";

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: token,
      },
    });

    const parsedAmount = parseInt(amount);
    let planName;
    const planValue = (parsedAmount / 100).toString(); // Convert amount to string and divide by 100
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsedAmount,
      currency,
      payment_method: paymentMethod.id,
      confirm: true,
    });

    if (
      paymentIntent.status === "requires_action" &&
      paymentIntent.next_action.type === "use_stripe_sdk"
    ) {
      const currentDate = new Date();
      let expiryDate = new Date(currentDate);

      if (planValue === "49") {
        // 49 plan for 1 month
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        planName = "BASIC"
      } else if (planValue === "99") {
        // 99 plan for 2 months
        expiryDate.setMonth(expiryDate.getMonth() + 2);
        planName = "STANDARD";
      } else if (planValue === "149") {
        // 149 plan for 3 months
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        planName = "PREMIUM";
      }

      let subscriptionData = {
        userType: userType,
        user: userid,
        plan: planValue,
        planName:planName,
        expiry: expiryDate,
      };

      await Subscription.create(subscriptionData);

      res.status(200).json({ message: "Payment succeeded!" });
    } else if (paymentIntent.status === "succeeded") {
      res.status(200).json({ message: "Payment succeeded!" });
    } else {
      res.status(400).json({ message: "Payment failed!" });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Error processing payment" });
  }
};


exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ role: "SHOP" });
    const data = categories.map((item) => item.name);
    res.send({ data });
  } catch (error) {
    console.log(error);
  }
};

exports.getDetailss = async (req, res) => {
  try {
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");

    const userId = jwtToken.id;
    const DATA = await Shop.findOne({ _id: userId });

    res.send({ DATA });
  } catch (error) {
    console.log(error);
  }
};


exports.generalEdit = async (req, res) => {
  try {
    const { name, businessType } = req.body;
   
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const image = req.file;
    const proId = jwtToken.id;

    const user = await Shop.findById({ _id: proId });
    if (businessType) {
      user.businessType = businessType;
      await user.save();
    }
    if (name) {
      user.name = name;
      await user.save();
    }
    if (image) {
      user.image = image.filename;
      await user.save();
    }

    res.send({ user });
  } catch (error) {
    console.log(error);
  }
};

exports.infoEdit = async (req, res) => {
  try {
    const { bio, location, district, mobile } = req.body;
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const proId = jwtToken.id;

    const user = await Shop.findById({ _id: proId });
    if (bio) {
      user.bio = bio;
      await user.save();
    }
    if (location) {
      user.location = location;
      await user.save();
    }
    if (district) {
      user.district = district;
      await user.save();
    }
    if (mobile) {
      user.mobile = mobile;
      await user.save();
    }

    res.send({ user });
  } catch (error) {
    console.log(error);
  }
};

exports.changePass = async (req, res) => {
  try {
    const { current, password } = req.body;
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const proId = jwtToken.id;

    const user = await Shop.findById({ _id: proId });

    const passMatch = await bcrypt.compare(current, user.password);

    if (passMatch) {
      const secure_password = await securePassword(password);
      user.password = secure_password;
      await user.save();
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.socialEdit = async (req, res) => {
  try {
    const { fb, twitter, insta, link } = req.body;
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const proId = jwtToken.id;

    const user = await Shop.findById({ _id: proId });

    if (fb) {
      user.facebook = fb;
      await user.save();
    }
    if (twitter) {
      user.twitter = twitter;
      await user.save();
    }
    if (insta) {
      user.insta = insta;
      await user.save();
    }
    if (link) {
      user.linkedin = link;
      await user.save();
    }

    res.send({ user });
  } catch (error) {
    console.log(error);
  }
};

exports.getProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const shop = await Shop.findOne({ "products._id": id });
    const product = shop.products.find((product) => product._id.toString() === id);
    res.send({ product });
  } catch (error) {
    console.log(error.message);
  }
};

exports.editProduct = async (req, res) => {
  try {
    const { name, price } = req.body;
    const image = req.file;
    const proID = req.query.id; 
    const updates = {}; 
    if (image?.filename) {
      updates["products.$.image"] = image.filename;
    }
    if (name) {
      updates["products.$.name"] = name;
    }
    if (price) {
      updates["products.$.price"] = price;
    }

    try {
      const updatedShop = await Shop.findOneAndUpdate(
        { "products._id": proID },
        {
          $set: updates,
        },
        { new: true }
      );

      res.send({ status: true });
    } catch (err) {
      console.error(err);
      // Handle any errors that occurred during the update
      // For example, you can send an error response
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;

    // Find the professional by ID
    const shop = await Shop.findOne({ "products._id": id });

    if (!shop) {
      return res
        .status(404)
        .json({ status: false, message: "shop not found" });
    }

    // Find the index of the work within the works array
    const productIndex = shop.products.findIndex(
      (product) => product._id.toString() === id
    );

    if (productIndex === -1) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    // Remove the work from the works array
    shop.products.splice(productIndex, 1);

    // Save the updated professional
    await shop.save();

    return res
      .status(200)
      .json({ status: true, message: "Product deleted successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

exports.getPlan = async (req, res) => {
  try {
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const proId = jwtToken.id;

    const plan = await Subscription.findOne({ user: proId });
    res.send({ plan });
  } catch (error) {
    console.log(error.message);
  }
};



exports.getChat = asyncHandler(async (req, res) => {
  const { userId, userType } = req.body;

  const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
  const userID = jwtToken.id;
  if (!userId || !userType) {
    console.log("UserId or UserType param not sent with request");
    return res.sendStatus(400);
  }

  try {
    const isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { refType: "Shop", refId: userID } } },
        { users: { $elemMatch: { refType: userType, refId: userId } } },
      ],
    })
      .populate({
        path: "users.refId",
        populate: {
          path: userType, // For Professional userType
          model: userType,
          select: "name",
        },
      })
      .populate("latestMessage")
      .populate("groupAdmin");

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [
          { refType: "Shop", refId: userID },
          { refType: userType, refId: userId },
        ],
        latestMessage: null,
        groupAdmin: null,
      };

      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate({
        path: "users.refId",
        populate: {
          path: userType, // For Professional userType
          model: userType,
          select: "name",
        },
      });

      res.status(200).json(FullChat);
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

exports.accessChat = asyncHandler(async (req, res) => {
  try {
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const userID = jwtToken.id;
    // const userID = "6489b09e829661f7c73c24f2";
    const userType = "Shop";

    let results = await Chat.find({
      "users.refType": userType,
      "users.refId": userID,
    })
      .populate({
        path: "users.refId",
        populate: {
          path: userType,
          model: userType,
          select: "name",
        },
      })
      .populate({
        path: "latestMessage.sender.refId",
        populate: {
          path: "latestMessage.sender.refType",
          model: "latestMessage.sender.refType",
          select: "name",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).send(results);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
  const userID = jwtToken.id;

  // const userID = "6489b09e829661f7c73c24f2";

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: { refType: "Shop", refId: userID },
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate({
      path: "sender.refId",
      select: "name image",
    });

    message = await message.populate({ path: "chat" });
    const users = message.chat.users;

    // Extract the refType values from the users array
    const refTypes = users.map((user) => user.refType);

    // Create an array of objects specifying the model and path for each refType
    const populateOptions = refTypes.map((refType) => ({
      path: "chat.users.refId",
      populate: {
        path: refType,
        model: refType,
        select: "name image",
      },
    }));

    message = await message.populate(populateOptions);

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

exports.allMessages = asyncHandler(async (req, res) => {
  try {
    const chatId = req.query.id;
    const messages = await Message.find({ chat: chatId })
      .populate({
        path: "sender.refId",
        select: "name image",
      })
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});