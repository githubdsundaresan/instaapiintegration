const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  instagramId: String,
  username: String,
  name: String,
  profilePicture: String,
  accessToken: String,
  media: Array,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', mongoose.Schema);