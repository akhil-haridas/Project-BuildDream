const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productsSchema = new Schema({
  name: {
    type:String
  },
  price: {
    type:String
  },
  image: {
    type:String
  }
});


const shopSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    email: {
      type: String,
    },
    bio: {
      type: String,
    },
    facebook: {
      type: String,
    },
    twitter: {
      type: String,
    },
    insta: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    role: {
      type: String,
      required: true,
    },
    subscription: {
      type: ObjectId,
    },
    businessType: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
    },
    location: {
      type: String,
    },
    district: {
      type: String,
    },
    verifyToken: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    products: [productsSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shop", shopSchema);
