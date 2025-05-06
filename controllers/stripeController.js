const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const getFrontendUrl = () => {
  // If in production, use the production URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.PRODUCTION_FRONTEND_URL || 'https://www.micuentacuentos.com';
  }
  // Otherwise use development URL
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

exports.createCheckoutSession = async (req, res) => {
  const frontendUrl = getFrontendUrl();
  console.log(`Using frontend URL: ${frontendUrl}`);
  try {
    console.log('Creating checkout session for email:', req.body.email);
    console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured');
    console.log('Stripe Price ID:', process.env.STRIPE_PRICE_ID ? 'Configured' : 'Not configured');
    console.log('Frontend URL:', process.env.FRONTEND_URL ? 'Configured' : 'Not configured');

    const { email } = req.body;

    if (!email) {
      console.log('No email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Stripe secret key is not configured' });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      console.error('STRIPE_PRICE_ID is not configured');
      return res.status(500).json({ error: 'Subscription price is not configured' });
    }

    if (!process.env.FRONTEND_URL) {
      console.error('FRONTEND_URL is not configured');
      return res.status(500).json({ error: 'Frontend URL is not configured' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      console.log('User not found, creating new user');
      user = await User.create({ email });
    }

    // Handle Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (stripeCustomerId) {
      try {
        // Verify if customer exists in Stripe
        await stripe.customers.retrieve(stripeCustomerId);
        console.log('Existing Stripe customer verified:', stripeCustomerId);
      } catch (error) {
        console.log('Stripe customer not found, creating new one');
        stripeCustomerId = null;
      }
    }

    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer');
      try {
        const customer = await stripe.customers.create({
          email: email,
        });
        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
        console.log('New Stripe customer created:', stripeCustomerId);
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return res.status(500).json({ error: 'Error creating customer', details: error.message });
      }
    }

    console.log('Creating Stripe checkout session');
    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/subscribe`,
        allow_promotion_codes: true,
      });

      console.log('Checkout session created successfully:', session.id);
      
      return res.json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      return res.status(500).json({ 
        error: 'Error creating checkout session',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Unexpected error in createCheckoutSession:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};

exports.handleSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    console.log('Processing successful payment for session:', session_id);

    if (!session_id) {
      return res.status(400).json({ error: 'No session ID provided' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Retrieved session:', session);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Find the user by Stripe customer ID
    const user = await User.findOne({ stripeCustomerId: session.customer });
    
    if (!user) {
      console.error('User not found for customer:', session.customer);
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user subscription status and story count
    user.subscriptionStatus = 'active';
    user.stripeSubscriptionId = session.subscription;
    user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    user.storiesRemaining = 30; // 30 stories for subscribers
    user.subscriptionType = 'premium';
    
    await user.save();

    console.log('User subscription updated successfully:', {
      email: user.email,
      status: user.subscriptionStatus,
      endDate: user.subscriptionEndDate,
      storiesRemaining: user.storiesRemaining,
      subscriptionType: user.subscriptionType
    });

    res.json({ 
      success: true,
      user: {
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        storiesRemaining: user.storiesRemaining,
        subscriptionType: user.subscriptionType
      }
    });
  } catch (error) {
    console.error('Error handling success:', error);
    res.status(500).json({ error: 'Error processing successful payment' });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Add logging to debug
    console.log('Webhook received. Raw body:', req.body);
    console.log('Stripe signature:', sig);
    console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);
    
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Webhook event constructed successfully:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionCancellation(deletedSubscription);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Handling checkout session completion for session:', session.id);
    const user = await User.findOne({ stripeCustomerId: session.customer });
    if (user) {
      user.subscriptionStatus = 'active';
      user.stripeSubscriptionId = session.subscription;
      user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      user.storiesRemaining = 30; // 30 stories for subscribers
      user.subscriptionType = 'premium';
      await user.save();
      console.log('Subscription activated for user:', user.email);
    } else {
      console.error('User not found for customer:', session.customer);
    }
  } catch (error) {
    console.error('Error handling checkout session completion:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    const user = await User.findOne({ stripeCustomerId: subscription.customer });
    if (user) {
      user.subscriptionStatus = subscription.status;
      user.stripeSubscriptionId = subscription.id;
      user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
      await user.save();
      console.log('Subscription updated for user:', user.email);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    const user = await User.findOne({ stripeCustomerId: subscription.customer });
    if (user) {
      user.subscriptionStatus = 'cancelled';
      user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
      await user.save();
      console.log('Subscription cancelled for user:', user.email);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
} 