const express = require("express");
const axios = require("axios");
const passport = require("passport");
const router = express.Router();

const INSTAGRAM_API_BASE_URL = "https://api.instagram.com";

// Ensure environment variables are set
if (
  !process.env.REACT_APP_INSTAGRAM_APP_ID ||
  !process.env.REACT_APP_INSTAGRAM_APP_SECRET ||
  !process.env.REACT_APP_INSTAGRAM_REDIRECT_URI
) {
  throw new Error(
    "Missing Instagram environment variables. Please check your .env file."
  );
}

// Instagram login route
router.get(
  "/instagram",
  passport.authenticate("instagram", { scope: ["user_profile", "user_media"] })
);

// Instagram callback route (GET)
router.get(
  "/instagram/callback",
  passport.authenticate("instagram", { failureRedirect: "/" }),
  (req, res) => {
    // Successful authentication, redirect to frontend profile page
    res.redirect(`${process.env.REACT_APP_CLIENT_URL}/profile`);
  }
);

// Instagram callback route (POST)
router.post("/instagram/callback", async (req, res) => {
  const { code } = req.body;

  try {
    const response = await axios.post(
      `${INSTAGRAM_API_BASE_URL}/oauth/access_token`,
      {
        client_id: process.env.REACT_APP_INSTAGRAM_APP_ID,
        client_secret: process.env.REACT_APP_INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.REACT_APP_INSTAGRAM_REDIRECT_URI,
        code,
      }
    );

    const { access_token, user_id } = response.data;

    // Fetch user details or save the access token in the database
    res.json({ success: true, access_token, user_id });
  } catch (error) {
    console.error(
      "Error exchanging code for access token:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error:
        "Failed to exchange code for access token. Please try again later.",
    });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res
        .status(500)
        .json({ success: false, error: "Failed to log out" });
    }
    res.redirect(process.env.REACT_APP_CLIENT_URL || "/");
  });
});

module.exports = router;
