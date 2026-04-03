// Netlify Function — create-payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Check secret key is set
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Stripe secret key not configured. Add STRIPE_SECRET_KEY to Netlify environment variables.' })
    };
  }

  // Parse body safely
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body.' })
    };
  }

  const { amount, currency, fund, frequency, firstName, lastName, email } = body;

  // Validate amount
  const amountInCents = Math.round(parseFloat(amount) * 100);
  if (!amountInCents || amountInCents < 100) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid amount. Minimum donation is $1.00.' })
    };
  }

  try {
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
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
