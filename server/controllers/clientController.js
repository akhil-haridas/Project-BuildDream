const User = require('../models/clientModel')
const bcrypt = require("bcrypt");



//Secure Password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately (e.g., throw an error, return a default value, etc.)
    throw new Error("Error while hashing password");
  }
};

//client Signup

exports.Signup = async (req, res) => {
    console.log('post signup ethitto');
  const { userName, mobile, password, image } = req.body;
  
  console.log(req.body,"body")

  try {
    let user = await User.findOne({ mobile: mobile });

    if (user) {
      return res.json({
        Status: false,
        message: 'Email already exists. Try logging in with this email.',
      });
    }

    const hashedPassword = await securePassword(password);

    user = await User.create({
      name: userName,
      mobile: mobile,
      password: hashedPassword,
      image: image,
      role: "client"
    });

    res.json({
      Status: true,
      message: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};