const express = require("express");
const axios = require("axios");
const qs = require("qs");
const router = express.Router();

const INSTAGRAM_API_BASE_URL = "https://graph.instagram.com";
const INSTAGRAM_OAUTH_URL = "https://api.instagram.com/oauth/access_token";
const INSTAGRAM_LOGIN_BASE_URL = "https://www.instagram.com/oauth/authorize";

// Instagram login route
router.get("/instagram", (req, res) => {
  const instagramLoginUrl = `${INSTAGRAM_LOGIN_BASE_URL}?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;

  res.redirect(instagramLoginUrl);
});

// ✅ Comments fetch route — moved OUTSIDE of callback
router.get("/instagram/media/:mediaId/comments", async (req, res) => {
  const { mediaId } = req.params;
  const { access_token } = req.query;

  try {
    console.log("Fetching comments for media ID:", mediaId);
    console.log(
      "Comments URL :",
      `${INSTAGRAM_API_BASE_URL}/${mediaId}/comments?access_token=${access_token}`
    );

    const commentsResponse = await axios.get(
      `${INSTAGRAM_API_BASE_URL}/${mediaId}/comments?access_token=${access_token}`
    );

    res.json({ success: true, comments: commentsResponse.data.data });
  } catch (error) {
    console.error(
      "Error fetching comments:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch comments." });
  }
});

// Post a comment to a media item
router.post("/instagram/media/:mediaId/comments", async (req, res) => {
  const { mediaId } = req.params;
  const { access_token, message } = req.body;

  try {
    console.log("Posting a comment to media ID:", mediaId);
    console.log("Message:", message);
    console.log("Access token:", access_token);

    // Make a POST request to the Instagram Graph API
    const postCommentResponse = await axios.post(
      `${INSTAGRAM_API_BASE_URL}/${mediaId}/comments`,
      qs.stringify({ message }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        params: { access_token },
      }
    );

    console.log("Comment posted successfully:", postCommentResponse.data);

    res.json({ success: true, comment: postCommentResponse.data });
  } catch (error) {
    console.error(
      "Error posting comment:",
      error.response?.data || error.message
    );
    res.status(500).json({ success: false, error: "Failed to post comment." });
  }
});

// Instagram OAuth callback route
router.get("/instagram/callback", async (req, res) => {
  const { code } = req.query;

  console.log("Received callback with code:", code);

  if (!code) {
    console.error("Authorization code is missing.");
    return res
      .status(400)
      .json({ success: false, error: "Authorization code is missing." });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      INSTAGRAM_OAUTH_URL,
      qs.stringify({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;
    console.log("Access token response:", tokenResponse.data);

    // Fetch profile
    const profileResponse = await axios.get(
      `${INSTAGRAM_API_BASE_URL}/me?fields=id,username,account_type,media_count,followers_count,biography&access_token=${access_token}`
    );
    const profile = profileResponse.data;

    // Fetch media
    const mediaResponse = await axios.get(
      `${INSTAGRAM_API_BASE_URL}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,username&access_token=${access_token}`
    );
    const media = mediaResponse.data.data;

    // ✅ Add access_token to each media item
    const mediaWithToken = media.map((item) => ({
      ...item,
      access_token,
    }));

    console.log("Media object with access token:", mediaWithToken);

    // Redirect to frontend
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(
      `${CLIENT_URL}/profile?profile=${encodeURIComponent(
        JSON.stringify(profile)
      )}&media=${encodeURIComponent(JSON.stringify(mediaWithToken))}`
    );
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
