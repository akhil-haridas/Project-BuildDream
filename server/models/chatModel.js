const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        refType: {
          type: String,
          enum: ["User", "Professional", "Shop"],
        },
        refId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "users.refType",
        },
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
