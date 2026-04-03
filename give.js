// give.js — Stripe payment integration
// REPLACE the placeholder below with your actual Stripe TEST publishable key
// Get it from: https://dashboard.stripe.com/test/apikeys
// It starts with pk_test_...

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51THDs8E5PnPIqw0MwGIgTcA0px9yuEnCEGQtwCTMd7kdS4IyHv6C8AgTnNB6RC80whS76qLePazfanrWryfiq7HA00dEwiUWxM';

// ── Stripe setup ──────────────────────────────
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();

const cardElement = elements.create('card', {
  style: {
    base: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '15px',
      color: '#1a2340',
      '::placeholder': { color: '#9ca3af' }
    },
    invalid: { color: '#e53e3e' }
  }
});
cardElement.mount('#card-element');

// Show card validation errors in real time
cardElement.on('change', ({ error }) => {
  document.getElementById('card-errors').textContent = error ? error.message : '';
});

// ── State ─────────────────────────────────────
let selectedFund = 'tithe';
let selectedAmount = 100;
let selectedFreq = 'once';

document.querySelectorAll('.fund-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fund-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedFund = btn.dataset.fund;
  });
});

document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.classList.contains('custom')) {
      document.getElementById('customAmountWrap').style.display = 'flex';
      selectedAmount = null;
    } else {
      document.getElementById('customAmountWrap').style.display = 'none';
      selectedAmount = parseInt(btn.dataset.amount);
    }
  });
});

document.getElementById('customAmount')?.addEventListener('input', e => {
  selectedAmount = parseFloat(e.target.value) || 0;
});

document.querySelectorAll('.freq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedFreq = btn.dataset.freq;
  });
});

// ── Handle payment ────────────────────────────
async function handleGive() {
  const firstName = document.getElementById('firstName')?.value.trim();
  const lastName = document.getElementById('lastName')?.value.trim();
  const email = document.getElementById('donorEmail')?.value.trim();

  // Basic validation
  if (!firstName || !lastName) { showMsg('Please enter your first and last name.', 'error'); return; }
  if (!email || !email.includes('@')) { showMsg('Please enter a valid email address.', 'error'); return; }
  if (!selectedAmount || selectedAmount < 1) { showMsg('Please select or enter a valid amount.', 'error'); return; }

  const btn = document.getElementById('giveBtn');
  btn.textContent = 'Processing…';
  btn.disabled = true;
  showMsg('', '');

  try {
    // Step 1: Ask our Netlify Function to create a PaymentIntent
    const res = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: selectedAmount,
        currency: 'usd',
        fund: selectedFund,
        frequency: selectedFreq,
        firstName, lastName, email
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Payment setup failed.');

    // Step 2: Confirm the card payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: `${firstName} ${lastName}`, email }
      }
    });

    if (stripeError) throw new Error(stripeError.message);

    // Step 3: Payment succeeded — save record to Supabase
    if (paymentIntent.status === 'succeeded') {
      try {
        if (window._supabase) {
          await window._supabase.from('donations').insert([{
            first_name: firstName,
            last_name: lastName,
            email,
            amount: selectedAmount,
            fund: selectedFund,
            frequency: selectedFreq,
            status: 'paid',
            stripe_payment_id: paymentIntent.id
          }]);
        }
      } catch (dbErr) {
        console.warn('Supabase save failed (payment still succeeded):', dbErr);
      }

      // Show success and redirect to thank you page
      showMsg(`✅ Thank you, ${firstName}! Your gift of $${selectedAmount} has been received. Redirecting…`, 'success');
      setTimeout(() => {
        window.location.href = `give-success.html?name=${encodeURIComponent(firstName)}&amount=${selectedAmount}&fund=${encodeURIComponent(selectedFund)}`;
      }, 2000);
    }

  } catch (err) {
    showMsg('Payment failed: ' + err.message, 'error');
    btn.textContent = 'Give Now';
    btn.disabled = false;
  }
}

function showMsg(msg, type) {
  const el = document.getElementById('giveMessage');
  if (!el) return;
  el.textContent = msg;
  el.className = 'give-message' + (type ? ' ' + type : '');
  el.style.display = msg ? 'block' : 'none';
}

window.handleGive = handleGive;
