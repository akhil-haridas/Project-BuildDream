const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const worksSchema = new Schema({
  title: {
    type:String
  },
  image: {
    type:String
  },
  description: {
    type:String
  }
})
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
      required: true,
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
    role: {
      type: String,
      required: true,
    },
    subscription: {
      type: ObjectId,
    },
    employmentType: {
      type: String,
      required: true,
    },
    expertise: {
      type: String,
      required: true,
        },
        status: {
        type:Boolean
    },
    address: [addressSchema],
    works:[worksSchema]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Professional", professionalSchema);
