const express = require("express");
const passport = require("passport");
const axios = require("axios");
const router = express.Router();

// Instagram login route
router.get(
  "/instagram",
  passport.authenticate("instagram", { scope: ["user_profile", "user_media"] })
);

// Instagram callback route
router.get(
  "/instagram/callback",
  passport.authenticate("instagram", { failureRedirect: "/" }),
  (req, res) => {
    // Successful authentication, redirect to profile
    res.redirect("/profile");
  }
);

router.post("/instagram/callback", async (req, res) => {
  const { code } = req.body;

  try {
    const response = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      {
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
      }
    );

    const { access_token, user_id } = response.data;

    // Fetch user details or save the access token in the database
    res.json({ success: true, access_token, user_id });
  } catch (error) {
    console.error("Error exchanging code for access token:", error);
    res.status(500).json({ success: false, error: "Failed to authenticate" });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// Check authentication status
router.get("/status", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ isAuthenticated: true, user: req.user });
  }
  res.json({ isAuthenticated: false });
});

module.exports = router;
