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
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        address: [addressSchema]

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
