// Give page — saves donation records to Supabase

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

let selectedFund = 'tithe', selectedAmount = 100, selectedFreq = 'once';

document.querySelectorAll('.fund-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fund-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedFund = btn.dataset.fund;
  });
});

document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.classList.contains('custom')) {
      document.getElementById('customAmountWrap').style.display = 'flex'; selectedAmount = null;
    } else {
      document.getElementById('customAmountWrap').style.display = 'none'; selectedAmount = parseInt(btn.dataset.amount);
    }
  });
});

document.getElementById('customAmount')?.addEventListener('input', e => { selectedAmount = parseFloat(e.target.value) || 0; });

document.querySelectorAll('.freq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedFreq = btn.dataset.freq;
  });
});

async function handleGive() {
  const firstName = document.getElementById('firstName')?.value.trim();
  const lastName  = document.getElementById('lastName')?.value.trim();
  const email     = document.getElementById('donorEmail')?.value.trim();

  if (!firstName || !lastName || !email) { showGiveMsg('Please fill in your name and email.', 'error'); return; }
  if (!selectedAmount || selectedAmount <= 0) { showGiveMsg('Please select or enter a valid amount.', 'error'); return; }

  const btn = document.getElementById('giveBtn');
  btn.textContent = 'Processing…'; btn.disabled = true;

  try {
    const db = await getSupabase();
    const { error } = await db.from('donations').insert([{
      first_name: firstName, last_name: lastName, email,
      amount: selectedAmount, fund: selectedFund, frequency: selectedFreq, status: 'pending'
    }]);
    if (error) throw error;
    showGiveMsg(`✅ Thank you, ${firstName}! Your gift of $${selectedAmount} to the ${selectedFund} fund has been recorded.`, 'success');
  } catch (e) {
    showGiveMsg('Something went wrong: ' + e.message, 'error');
  }

  btn.textContent = 'Submit Gift'; btn.disabled = false;
}

function showGiveMsg(msg, type) {
  let el = document.getElementById('giveMessage');
  if (!el) { el = document.createElement('div'); el.id = 'giveMessage'; document.getElementById('giveBtn').after(el); }
  el.style.cssText = `margin-top:1rem;padding:.85rem 1.1rem;border-radius:8px;font-size:.9rem;text-align:center;
    ${type === 'success' ? 'background:#e8f5ee;border:1px solid #b2dfc4;color:#1a6b42;' : 'background:#fdecea;border:1px solid #f5c6cb;color:#9b1c1c;'}`;
  el.textContent = msg;
}

window.handleGive = handleGive;
