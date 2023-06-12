const Professional = require("../models/professionalModel");
const Shop = require("../models/shopModel");
const User = require("../models/clientModel");
const Category = require("../models/categoryModel");
const Subscription = require("../models/subscriptionModel");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const stripe = require("stripe")(
  "sk_test_51NGJfDSFVO01dJRlhSsvRF5igbmSH8UZtGIpFmUnYMliDhK2cPGyn3l6qofCIxPNmbhDwC4vvAuU57lFJtqu3UGC00H8jnNMtb"
);

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
    console.log(jwtToken.id);
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

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: token,
      },
    });
    const parsedAmount = parseInt(amount);
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
      const expiryDate = new Date(currentDate);
      expiryDate.setDate(expiryDate.getDate() + 30);

      await Subscription.create({
        user: userid,
        plan: amount,
        expiry: expiryDate,
      });

      res.status(200).json({ message: "Payment succeeded!" });
      // res.status(200).json({
      //   requiresAction: true,
      //   paymentIntentId: paymentIntent.id,
      //   clientSecret: paymentIntent.client_secret,
      //   stripeSdkUrl: paymentIntent.next_action.use_stripe_sdk.stripe_js,
      // });
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