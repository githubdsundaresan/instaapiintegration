const express = require("express");
const axios = require("axios");
const router = express.Router();

const INSTAGRAM_API_BASE_URL = "https://graph.instagram.com";
const INSTAGRAM_OAUTH_URL = "https://api.instagram.com/oauth/access_token";

// Instagram login route
router.get("/instagram", (req, res) => {
  const instagramLoginUrl = `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  res.redirect(instagramLoginUrl);
});

// Instagram callback route
router.get("/instagram/callback", async (req, res) => {
  const { code } = req.query;

  console.log("Received callback with code:", code); // Debugging log

  if (!code) {
    console.error("Authorization code is missing.");
    return res
      .status(400)
      .json({ success: false, error: "Authorization code is missing." });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(INSTAGRAM_OAUTH_URL, {
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code,
    });

    console.log("Access token response:", tokenResponse.data); // Debugging log

    const { access_token } = tokenResponse.data;

    // Fetch user profile
    const profileResponse = await axios.get(
      `${INSTAGRAM_API_BASE_URL}/me?fields=id,username,account_type,media_count&access_token=${access_token}`
    );

    console.log("User profile response:", profileResponse.data); // Debugging log

    const profile = profileResponse.data;

    // Fetch user media
    const mediaResponse = await axios.get(
      `${INSTAGRAM_API_BASE_URL}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,username&access_token=${access_token}`
    );

    console.log("User media response:", mediaResponse.data); // Debugging log

    const media = mediaResponse.data.data;

    // Send profile and media to the frontend
    res.json({ success: true, profile, media });
  } catch (error) {
    console.error(
      "Error during Instagram callback:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch data from Instagram." });
  }
});

module.exports = router;
