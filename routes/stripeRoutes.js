const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const authenticateJWT = require('../middleware/auth');

// Get the frontend URL from environment variables or use a default
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.micuentacuentos.com';

// Create a Stripe checkout session
router.post('/create-checkout-session', authenticateJWT, async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Creating checkout session for:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get success and cancel URLs from request or use defaults
    const successUrl = req.body.successUrl || `${FRONTEND_URL}/success`;
    const cancelUrl = req.body.cancelUrl || `${FRONTEND_URL}/subscribe`;
    
    console.log('Using success URL:', successUrl);
    console.log('Using cancel URL:', cancelUrl);
    
    // Find user by ID from JWT
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: email,
      client_reference_id: req.user.userId,
      metadata: {
        userId: req.user.userId
      }
    });
    
    console.log('Checkout session created:', session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify subscription success
router.get('/success', authenticateJWT, async (req, res) => {
  try {
    const { session_id } = req.query;
    console.log('Verifying subscription with session ID:', session_id);
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Retrieved session:', session.id, 'Status:', session.payment_status);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // Get user ID from session metadata or client_reference_id
    const userId = session.metadata.userId || session.client_reference_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in session' });
    }
    
    // Update user subscription status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user with subscription details
    user.subscriptionStatus = 'active';
    user.stripeCustomerId = session.customer;
    user.stripeSubscriptionId = session.subscription;
    user.storiesRemaining = 30; // Reset stories for subscribers
    
    await user.save();
    console.log('User subscription activated:', user.email);
    
    res.json({
      success: true,
      message: 'Subscription activated successfully'
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler for subscription events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle subscription events
  if (event.type === 'customer.subscription.deleted' ||
      event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    
    // Find user with this subscription
    const user = await User.findOne({ stripeSubscriptionId: subscription.id });
    
    if (user) {
      if (subscription.status === 'active') {
        user.subscriptionStatus = 'active';
      } else if (subscription.status === 'canceled') {
        user.subscriptionStatus = 'cancelled';
      }
      
      await user.save();
      console.log('User subscription updated:', user.email, 'Status:', user.subscriptionStatus);
    }
  }
  
  res.json({ received: true });
});

// Get user's subscription status
router.get('/subscription-status', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      status: user.subscriptionStatus,
      storiesRemaining: user.storiesRemaining
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    // Cancel subscription in Stripe
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    // Update user status
    user.subscriptionStatus = 'cancelled';
    await user.save();
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;