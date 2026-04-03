// Netlify Function — create-payment.js
// Runs securely on the server. Your Stripe secret key never touches the browser.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, currency, fund, frequency, firstName, lastName, email } = JSON.parse(event.body);

    // Validate amount (must be a positive integer in cents)
    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (!amountInCents || amountInCents < 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid amount. Minimum donation is $1.00.' })
      };
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency || 'usd',
      receipt_email: email,
      metadata: {
        fund: fund || 'general',
        frequency: frequency || 'once',
        donor_name: `${firstName} ${lastName}`,
        donor_email: email,
        church: 'Phoenix Ghanaian SDA Church'
      },
      description: `${fund || 'General'} offering — Phoenix Ghanaian SDA Church`
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret })
    };

  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
