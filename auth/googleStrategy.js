const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../db/schema");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI, // ✅ dynamic from .env
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("No email returned"));

          let user = await User.findOne({ email });

          if (!user) {
            user = new User({
              googleId: profile.id,
              username: profile.displayName || email.split("@")[0],
              email,
              scores: { easy: 0, medium: 0, hard: 0 },
            });
            await user.save();
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
