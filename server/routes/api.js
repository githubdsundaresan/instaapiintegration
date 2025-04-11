const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const Comment = require("../models/Comment");
const router = express.Router();

const INSTAGRAM_API_BASE_URL = "https://graph.instagram.com";

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
};

// Get user profile
router.get("/profile", isAuthenticated, (req, res) => {
  res.json(req.user);
});

// Fetch user media
router.get("/media", isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(
      `${INSTAGRAM_API_BASE_URL}/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${req.user.accessToken}`
    );

    // Update user's media in database only if it has changed
    const existingMedia = req.user.media || [];
    if (JSON.stringify(existingMedia) !== JSON.stringify(response.data.data)) {
      await User.findByIdAndUpdate(req.user._id, { media: response.data.data });
    }

    res.json(response.data.data);
  } catch (error) {
    console.error(
      "Error fetching media:",
      error.response?.data || error.message
    );

    // Handle token expiry
    if (
      error.response?.status === 400 &&
      error.response?.data?.error?.type === "OAuthException"
    ) {
      return res
        .status(401)
        .json({ error: "Access token expired. Please log in again." });
    }

    res.status(500).json({
      error: "Failed to fetch media from Instagram. Please try again later.",
    });
  }
});

// Get comments for a specific media
router.get("/media/:mediaId/comments", isAuthenticated, async (req, res) => {
  try {
    const comments = await Comment.find({ mediaId: req.params.mediaId });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error.message);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a comment to media
router.post("/media/:mediaId/comments", isAuthenticated, async (req, res) => {
  try {
    const comment = new Comment({
      mediaId: req.params.mediaId,
      userId: req.user._id,
      text: req.body.text,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

module.exports = router;
