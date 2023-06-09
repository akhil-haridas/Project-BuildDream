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

// Signup

exports.Signup = async (req, res) => {
  try {
    const { userName, location, password, role, district, expert, email } =
      req.body;

    let professional = await Professional.findOne({ email: email });
    const shop = await Shop.findOne({ email: email });
    const user = await User.findOne({ email: email });

    if (professional || shop || user) {
      if (user) {
        return res.json({
          Status: false,
          message: "You have already have a client account using this email.",
        });
      }
      if (shop) {
        return res.json({
          Status: false,
          message: "You have already have a Shop account using this email.",
        });
      }
      return res.json({
        Status: false,
        message:
          "Mobile Number Already exists. Try logging in with this Mobile email.",
      });
    }

    const hashedPassword = await securePassword(password);
    const verificationToken = uuidv4();
    professional = await Professional.create({
      name: userName,
      location: location,
      password: hashedPassword,
      role: role,
      district: district,
      expertise: expert,
      email: email,
      status: false,
      verify: false,
      verifyToken: verificationToken,
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
        html: `
    <p>Dear ${userName},</p>
    <p>You have requested to join our community. Please click the link below to verify your email:</p>
    <a href="http://localhost:4000/professional/verify-email/${verificationToken}">Verify Email</a>
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
    console.log(token);
    const user = await Professional.findOne({ verifyToken: token });

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
    console.log(email, password);
    const userLOGIN = {
      status: false,
      message: null,
      token: null,
      name: null,
      role: null,
      plan: false,
      id: null,
    };

    let active = false
    const professional = await Professional.find({ email: email });

    if (!professional) {
      userLOGIN.message = "Your Email  is wrong";
      res.send({ userLOGIN });
      return;
    }

    if (!professional[0].verified) {
      userLOGIN.message =
        "Your Email  is not verified ,please verify your mail";
      res.send({ userLOGIN });
      return;
    }

    if (professional) {
      if (!professional[0].status) {
        userLOGIN.message = "Your account is not approved,wait please!";
        res.send({ userLOGIN });
        return;
      }

      const member = await Subscription.findOne({ user: professional[0]._id });
      if (member) {
        const currentDate = new Date();
        const expiryDate = new Date(member.expiry);
        console.log(expiryDate);

        if (expiryDate < currentDate) {
          active = false;
          console.log("Subscription has expired");
        } else {
          active = true;
          console.log("Subscription is still active");
        }
      }
      

      const isMatch = await bcrypt.compare(password, professional[0].password);

      if (isMatch) {
        const token = jwt.sign({ id: professional[0]._id }, "secretCode", {
          expiresIn: "30d",
        });
        userLOGIN.status = true;
        userLOGIN.name = professional[0].name;
        userLOGIN.token = token;
        userLOGIN.role = professional[0].role;
        userLOGIN.plan = active
        userLOGIN.id = professional[0]._id;

        const obj = {
          token,
          name: professional[0].name,
          role: professional[0].role,
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

exports.addWork = async (req, res) => {
  try {
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");

    const { title, description } = req.body;
    const image = req.file;

    const proId = jwtToken.id;

    const work = {
      title,
      image: image.filename,
      description,
    };
    console.log(work, "work");

    // Find the shop by ID and update the products array
    const updatedProfessional = await Professional.findByIdAndUpdate(
      proId,
      { $push: { works: work } },
      { new: true }
    );
    console.log(updatedProfessional);
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
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
    const categories = await Category.find({ role: "PROFESSIONAL" });
    const data = categories.map((item) => item.name);
    res.send({ data });
  } catch (error) {
    console.log(error);
  }
};
