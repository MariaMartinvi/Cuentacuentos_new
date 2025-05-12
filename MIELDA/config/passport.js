const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
      ? 'https://micuentacuentos.com/api/auth/google/callback'
      : 'http://localhost:5001/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Buscar si el usuario ya existe
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // Si no existe, crear nuevo usuario
        user = await User.create({
          email: profile.emails[0].value,
          googleId: profile.id,
          isVerified: true // Los usuarios de Google ya están verificados
        });
      } else if (!user.googleId) {
        // Si existe pero no tiene googleId, actualizarlo
        user.googleId = profile.id;
        user.isVerified = true;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 