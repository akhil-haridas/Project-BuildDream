const User = require("../models/clientModel");
const Professional = require("../models/professionalModel");
const Shop = require("../models/shopModel");
const Category = require("../models/categoryModel");
const Chat = require("../models/chatModel");
const Requirement = require("../models/requirementModel"); 
const Message = require("../models/messageModel");
const Magazine = require("../models/magazinModel")
const asyncHandler = require("express-async-handler");
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
      id:null
    };

    const user = await User.findOne({ mobile: mobileNumber });
    if (!user) {
      userLOGIN.message = "Your mobile number is wrong";
      res.send({ userLOGIN });
      return;
    }

       

    if (user) {
      if (user.block) {
        userLOGIN.message = "Your are blocked by admin";
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
        userLOGIN.role = user.role;
        userLOGIN.id = user._id
        const obj = {
          token,
          name: user.name,
          role: user.role,
          id:user._id
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
      userRESET.status = true;
      res.send({ userRESET });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//Reset Password

exports.Resetpass = async (req, res) => {
  try {
    const { password, mobile } = req.body;
    const userRESET = {
      status: false,
      message: null,
    };

    const user = await User.findOne({ mobile: mobile });

    const hashPassword = await securePassword(password);

    user.password = hashPassword;

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

exports.getAvatar = async (req, res) => {
  try {
    const id = req.query.id;
    // Find user in the Professional collection
    const professionalUser = await Professional.findById({ _id: id });
    // Find user in the Shop collection
    const shopUser = await Shop.findById({ _id: id });
    const clientUser = await User.findById({ _id: id });
    if (clientUser) {
      let DATA = clientUser;
      return res.send({ DATA });
    }
    if (professionalUser) {
      let DATA = professionalUser;
      return res.send({ DATA });
    }
    if (shopUser) {
      let DATA = shopUser;
      return res.send({ DATA });
    }
  } catch (error) {
    console.log(error);
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
        { users: { $elemMatch: { refType: "User", refId: userID } } },
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
          { refType: "User", refId: userID },
          { refType: userType, refId: userId },
        ],
        latestMessage: null,
        groupAdmin: null,
      };

      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate({
        path: "users.refId",
        populate: {
          path: userType, 
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
})

exports.accessChat = asyncHandler(async (req, res) => {
  try {
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const userID = jwtToken.id;
    // const userID = "6489b09e829661f7c73c24f2";
    const userType = "User";

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
})

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
    sender: { refType: "User", refId: userID },
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
    const chatId = req.query.id
    const messages = await Message.find({ chat: chatId })
      .populate({
      path: "sender.refId",   
      select: "name image",
    }).populate("chat")
    res.json(messages);  
  } catch (error) {
    res.status(400); 
    throw new Error(error.message);
  }
});


exports.getMagazine = async (req, res) => {
  try {
    const magazines = await Magazine.find({}).populate("user")
    const categories = await Category.find({})
    const requirements = await Requirement.find({ status: false }).populate("user").sort({createdAt:-1})
    res.send({ magazines, categories, requirements })
  } catch (error) {
    console.log(error.message)
  }
}

exports.addRequirement = async (req, res) => {
  try {
    const { category, requirement } = req.body;
    const jwtToken = jwt.verify(req.cookies.jwt.token, "secretCode");
    const userID = jwtToken.id;

    // Create a new requirement instance
    const newRequirement = new Requirement({
      user: userID,
      category: category,
      requirement: requirement,
    });

    // Save the requirement to the database
    const savedRequirement = await newRequirement.save();

    // Respond with the saved requirement
    res.status(200).json(savedRequirement);
  } catch (error) {
    console.log(error.message);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: "Internal server error" });
  }
};
