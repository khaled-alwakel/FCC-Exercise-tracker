// connect to mongodb
const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://Khaled-Alwakel:Xor3KS9Hm1ffWxpT@cluster0.g1hid9r.mongodb.net/users?retryWrites=true&w=majority"
);

const userSchema = new mongoose.Schema({
  username: String,
  exercises: {
    type: [
      {
        description: String,
        duration: Number,
        date: String,
      },
    ],
    default: [],
    z,
  },
});

module.exports = mongoose.model("User", userSchema);
