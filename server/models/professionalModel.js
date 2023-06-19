const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const worksSchema = new Schema({
  title: {
    type: String,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
});

const professionalSchema = new Schema(
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
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
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
    employmentType: {
      type: String,
    },
    expertise: {
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
    block: {
      type: Boolean,
      default: false,
    },
    Professional: {
      type: Schema.Types.ObjectId,
      ref: "Professional",
    },
    Shop: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    User: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    Chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    works: [worksSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Professional", professionalSchema);
