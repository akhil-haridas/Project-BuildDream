const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const subsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userType",
    },
    userType: {
      type: String,
      required: true,
      enum: ["Professional", "Shop"],
    },
    planName: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      required: true,
    },
    expiry: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", subsSchema);
