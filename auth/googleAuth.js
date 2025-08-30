const express = require("express");
const passport = require("passport");
const { generateToken } = require("./jwt");

const router = express.Router();

// 🔹 Start Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔹 Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.PUBLIC_URL_FRONTEND}/registration`,
    session: false,
  }),
  (req, res) => {
    try {
      const token = generateToken({ id: req.user._id, email: req.user.email });

      const redirectTo = `${process.env.PUBLIC_URL_FRONTEND}/home?token=${token}`;
      res.redirect(redirectTo);
    } catch (err) {
      console.error("OAuth error:", err);
      res.redirect(
        `${process.env.PUBLIC_URL_FRONTEND}/registration?error=OAuthFailed`
      );
    }
  }
);

module.exports = router;
