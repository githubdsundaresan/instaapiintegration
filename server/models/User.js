const mongoose = require("mongoose");

// Define the schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  instagramId: { type: String, required: true },
  accessToken: { type: String, required: true },
});

// Create the model
const User = mongoose.model("User", userSchema);

module.exports = User;
