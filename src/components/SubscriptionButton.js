import React from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RHQND2VwHWYt9L3y3Sh7y6UZ3Cwr4E5M1yNLLkby7g8M6VRsECRTzz9kEtQQEFXbnvcP83l6H2QTkEoDiLs8itj00lkp4ysmv');

const SubscriptionButton = ({ email, onError }) => {
  const handleSubscribe = async () => {
    try {
      console.log('Starting subscription process for email:', email);
      
      // Create checkout session
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/stripe/create-checkout-session`, {
        email,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/subscribe`
      });

      console.log('Checkout session response:', response.data);

      // Get the session ID
      const { id } = response.data;
      console.log('Session ID:', id);

      // Load Stripe
      const stripe = await stripePromise;
      
      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: id
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in subscription process:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      onError?.(error.message || 'Something went wrong');
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Subscribe Now
    </button>
  );
};

export default SubscriptionButton; 