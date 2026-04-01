// Contact form — powered by Supabase

function getSupabase() {
  return new Promise((resolve, reject) => {
    if (window._supabase) return resolve(window._supabase);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window._supabase) { clearInterval(interval); resolve(window._supabase); }
      else if (attempts > 50) { clearInterval(interval); reject(new Error('Could not connect. Please refresh and try again.')); }
    }, 100);
  });
}

async function handleContact() {
  const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
  const [firstName, lastName, email, subject, message] = [...inputs].map(i => i.value.trim());

  if (!firstName || !lastName || !email || !subject || !message) {
    showContactMsg('Please fill in all fields before submitting.', 'error'); return;
  }

  const btn = document.querySelector('.contact-form .btn');
  btn.textContent = 'Sending…'; btn.disabled = true;

  try {
    const db = await getSupabase();
    const { error } = await db.from('contact_messages').insert([{ first_name: firstName, last_name: lastName, email, subject, message }]);
    if (error) throw error;
    inputs.forEach(i => i.value = '');
    showContactMsg('✅ Thank you! Your message has been received. We\'ll be in touch soon.', 'success');
  } catch (e) {
    showContactMsg('Something went wrong: ' + e.message, 'error');
  }

  btn.textContent = 'Send Message'; btn.disabled = false;
}

function showContactMsg(msg, type) {
  const el = document.getElementById('contactSuccess');
  el.textContent = msg;
  el.style.cssText = `display:block;padding:.85rem 1.1rem;border-radius:8px;font-size:.9rem;margin-top:1rem;
    ${type === 'success' ? 'background:#e8f5ee;border:1px solid #b2dfc4;color:#1a6b42;' : 'background:#fdecea;border:1px solid #f5c6cb;color:#9b1c1c;'}`;
  if (type === 'success') setTimeout(() => el.style.display = 'none', 8000);
}

window.handleContact = handleContact;
