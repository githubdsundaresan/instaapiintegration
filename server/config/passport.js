const passport = require("passport");
const InstagramStrategy = require("passport-instagram").Strategy;
const User = require("../models/User");

passport.use(
  new InstagramStrategy(
    {
      clientID: process.env.INSTAGRAM_APP_ID,
      clientSecret: process.env.INSTAGRAM_APP_SECRET,
      callbackURL:
        process.env.INSTAGRAM_REDIRECT_URI ||
        "http://localhost:5000/auth/instagram/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find existing user or create new one
        let user = await User.findOne({ instagramId: profile.id });

        if (!user) {
          user = new User({
            instagramId: profile.id,
            username: profile.username,
            name: profile.displayName,
            profilePicture: profile._json?.data?.profile_picture || "",
            accessToken,
          });
        } else {
          // Update access token
          user.accessToken = accessToken;
        }

        await user.save();
        return done(null, user);
      } catch (err) {
        console.error("Error in InstagramStrategy:", err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
