const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  mediaId: String,
  text: String,
  username: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  replies: [{
    username: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Comment', CommentSchema);