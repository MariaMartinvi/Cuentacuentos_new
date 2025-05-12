const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Google auth routes are working' });
});

// Ruta para iniciar el proceso de autenticación con Google
router.get('/google', (req, res) => {
  console.log('Google route hit');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
});

// Ruta de callback después de la autenticación con Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      // Generar token JWT
      const token = jwt.sign(
        { 
          id: req.user._id,
          email: req.user.email,
          isPremium: req.user.isPremium,
          subscriptionStatus: req.user.subscriptionStatus
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Redirigir al frontend con el token
      const frontendUrl = process.env.NODE_ENV === 'production'
        ? 'https://micuentacuentos.com'
        : process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      const frontendUrl = process.env.NODE_ENV === 'production'
        ? 'https://micuentacuentos.com'
        : process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
); 