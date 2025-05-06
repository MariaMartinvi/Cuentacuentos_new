// Load environment variables first
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
console.log('Loading environment variables from:', envPath);

// Only try to load .env file if it exists (development environment)
if (fs.existsSync(envPath)) {
  console.log('.env file found, loading from file');
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
  }
} else {
  console.log('No .env file found, using environment variables from system');
}

// Log environment variables (without sensitive data)
console.log('Environment Variables Check:');
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 'NOT SET');
console.log('STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'NOT SET');
console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID || 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
if (process.env.OPENAI_API_KEY) {
  console.log('OpenAI API Key: Configurada (primeros caracteres: ' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)');
} else {
  console.log('OpenAI API Key: NO CONFIGURADA');
}

// Only after environment variables are loaded, require other modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');
const storyRoutes = require('./routes/storyRoutes');
const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripeRoutes');
const audioRoutes = require('./routes/audioRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Create Express app
const app = express();

// Middleware
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5001',
  'https://www.micuentacuentos.com',
  'https://micuentacuentos.com',
  'https://cuentacuentosfront.onrender.com',
  'https://micuentacuentosfront.onrender.com'
];

console.log('Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Test route that will help confirm the server is working
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Routes
console.log('Registering routes...');
app.use('/api/stories', storyRoutes);
console.log('Story routes registered');
app.use('/api/auth', authRoutes);
console.log('Auth routes registered');
app.use('/api/auth', googleAuthRoutes);
console.log('Google auth routes registered');
app.use('/api/stripe', stripeRoutes);
console.log('Stripe routes registered');
app.use('/api/audio', audioRoutes);
console.log('Audio routes registered');
app.use('/api/subscription', subscriptionRoutes);
console.log('Subscription routes registered');

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Log routes after they're all registered
console.log('All routes registered. Listing routes:');
const listRoutes = () => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const basePath = middleware.regexp.toString().split('?')[1].slice(0, -3);
          routes.push({
            path: basePath + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  return routes;
};

console.log('Routes:', JSON.stringify(listRoutes(), null, 2));

// Catch-all route for debugging
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});

module.exports = app;
