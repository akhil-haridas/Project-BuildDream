const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    sender: {
      refType: {
        type: String,
        enum: ["User", "Professional", "Shop"],
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "sender.refType",
      },
    },
    content: { type: String, trim: true },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
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
    Message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
