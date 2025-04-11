const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Comment = require('../models/Comment');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get user profile
router.get('/profile', isAuthenticated, (req, res) => {
  res.json(req.user);
});

// Fetch user media
router.get('/media', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${req.user.accessToken}`);
    
    // Update user's media in database
    await User.findByIdAndUpdate(req.user._id, { media: response.data.data });
    
    res.json(response.data.data);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Get comments for a specific media
router.get('/media/:mediaId/comments', isAuthenticated, async (req, res) => {
  try {
    const comments = await Comment.find({ mediaId: req.params.mediaId });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to media
router.post('/media/:mediaId/comments', isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;
    
    const comment = new Comment({
      mediaId: req.params.mediaId,
      text,
      username: req.user.username
    });
    
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Add a reply to a comment
router.post('/comments/:commentId/replies', isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;
    
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    comment.replies.push({
      username: req.user.username,
      text
    });
    
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

module.exports = router;