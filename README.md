# Phoenix Ghanaian SDA Church Website

A modern, full multi-page church website built with HTML, CSS, and vanilla JavaScript.

## Pages
- `index.html` — Homepage (hero, service times, about snippet, pillars, give CTA)
- `about.html` — About the church, mission, leadership, beliefs
- `sermons.html` — Sermon archive grid
- `events.html` — Upcoming events list
- `give.html` — Online giving page (Stripe-ready form)
- `contact.html` — Contact form & church info

## Files
- `styles.css` — All styles with CSS variables, animations, responsive breakpoints
- `main.js` — Scroll effects, mobile menu, form handlers, Stripe integration stubs

---

## Supabase Integration (TODO)

Install: `npm install @supabase/supabase-js`

```js
// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

export default supabase
```

**Use cases:**
- Store contact form submissions → `supabase.from('contacts').insert({...})`
- Store giving records → `supabase.from('giving').insert({...})`
- Member directory / prayer requests table
- Sermon uploads (Supabase Storage)

---

## Stripe Integration (TODO)

Install: `npm install stripe` (backend) + load `https://js.stripe.com/v3/` (frontend)

**Frontend (give.html):**
```js
const stripe = Stripe('pk_live_YOUR_KEY');
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#stripe-card-element');
```

**Backend (Node/Express or serverless):**
```js
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price_data: { currency: 'usd', unit_amount: amount * 100, product_data: { name: fund } }, quantity: 1 }],
  mode: 'payment',
  success_url: 'https://yoursite.com/thank-you',
  cancel_url: 'https://yoursite.com/give',
});
res.json({ id: session.id });
```

---

## Design
- Color palette: Navy (#1a3a6b), Gold accent (#c8a84b), White/Off-white
- Fonts: Playfair Display (headings) + DM Sans (body)
- Animations: CSS keyframes + IntersectionObserver scroll reveals
- Responsive: Mobile hamburger menu, stacked grid layouts
