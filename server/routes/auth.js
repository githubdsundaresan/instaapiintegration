// auth.js — Using Facebook Login + Instagram Graph API

const express = require("express");
const axios = require("axios");
const qs = require("qs");
const router = express.Router();

const FB_GRAPH_BASE_URL = "https://graph.facebook.com/v19.0";

// Redirect to Facebook Login Dialog
router.get("/instagram", (req, res) => {
  const facebookLoginUrl = `${FB_GRAPH_BASE_URL}/dialog/oauth?client_id=${process.env.FB_APP_ID}&redirect_uri=${process.env.FB_REDIRECT_URI}&scope=instagram_basic,instagram_manage_comments,pages_show_list,pages_read_engagement&response_type=code`;
  console.log("Redirecting to Facebook Login:", facebookLoginUrl);
  res.redirect(facebookLoginUrl);
});

// Callback from Facebook Login
router.get("/instagram/callback", async (req, res) => {
  const { code } = req.query;
  if (!code)
    return res.status(400).json({ success: false, error: "Missing code" });

  try {
    console.log("1. Exchanging code for access token");
    const tokenResponse = await axios.get(
      `${FB_GRAPH_BASE_URL}/oauth/access_token`,
      {
        params: {
          client_id: process.env.FB_APP_ID,
          client_secret: process.env.FB_APP_SECRET,
          redirect_uri: process.env.FB_REDIRECT_URI,
          code,
        },
      }
    );
    const userAccessToken = tokenResponse.data.access_token;
    console.log("✅ Got userAccessToken:", userAccessToken);

    console.log("2. Getting user's Facebook Pages...");
    const pagesResponse = await axios.get(`${FB_GRAPH_BASE_URL}/me/accounts`, {
      params: { access_token: userAccessToken },
    });
    const page = pagesResponse.data.data[0];
    if (!page) throw new Error("No pages found");
    const pageAccessToken = page.access_token;
    console.log("✅ Got Page ID:", page.id);

    console.log("3. Getting linked Instagram Business Account...");
    const igAccountResponse = await axios.get(
      `${FB_GRAPH_BASE_URL}/${page.id}`,
      {
        params: {
          fields: "instagram_business_account",
          access_token: pageAccessToken,
        },
      }
    );
    const igUserId = igAccountResponse.data.instagram_business_account?.id;
    if (!igUserId) throw new Error("No Instagram Business account found");
    console.log("✅ Got IG User ID:", igUserId);

    console.log("4. Fetching Instagram profile...");
    const profileResponse = await axios.get(
      `${FB_GRAPH_BASE_URL}/${igUserId}`,
      {
        params: {
          fields: "name,username",
          access_token: pageAccessToken,
        },
      }
    );
    const profile = profileResponse.data;
    console.log("✅ Got profile:", profile);

    console.log("5. Fetching media...");
    const mediaResponse = await axios.get(
      `${FB_GRAPH_BASE_URL}/${igUserId}/media`,
      {
        params: {
          fields: "id,caption,media_type,media_url,timestamp",
          access_token: pageAccessToken,
        },
      }
    );
    const media = mediaResponse.data.data;
    console.log("✅ Got media:", media.length, "items");

    // Redirect to frontend
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(
      `${CLIENT_URL}/profile?profile=${encodeURIComponent(
        JSON.stringify(profile)
      )}&media=${encodeURIComponent(JSON.stringify(media))}`
    );
  } catch (err) {
    console.error(
      "Instagram Graph API login failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ success: false, error: "Instagram login failed." });
  }
});

// Fetch comments for a media item
router.get("/instagram/media/:mediaId/comments", async (req, res) => {
  const { mediaId } = req.params;
  const { access_token } = req.query;

  try {
    const commentsResponse = await axios.get(
      `${FB_GRAPH_BASE_URL}/${mediaId}/comments`,
      {
        params: { access_token },
      }
    );
    res.json({ success: true, comments: commentsResponse.data.data });
  } catch (error) {
    console.error(
      "Failed to fetch comments:",
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

    const postCommentResponse = await axios.post(
      `${FB_GRAPH_BASE_URL}/${mediaId}/comments`,
      qs.stringify({ message }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        params: { access_token },
      }
    );

    res.json({ success: true, comment: postCommentResponse.data });
  } catch (error) {
    console.error(
      "Error posting comment:",
      error.response?.data || error.message
    );
    res.status(500).json({ success: false, error: "Failed to post comment." });
  }
});

module.exports = router;
