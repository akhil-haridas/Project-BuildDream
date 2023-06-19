const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const addressSchema = new Schema({
    street: {
        type: String,
    },
    city: {
        type: String,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    },
    zip: {
        type: String,
    }

})

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    bio: {
      type: String,
    },
    role: {
      type: String,
      required: true,
    },
    block: {
      type: Boolean,
      default: false,
    },
    User: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    Professional: {
      type: Schema.Types.ObjectId,
      ref: "Professional",
    },
    Shop: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    Chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    address: [addressSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
