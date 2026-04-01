// ── Auth logic — Supabase Auth ────────────────

function getSupabase() {
  return new Promise((resolve, reject) => {
    if (window._supabase) return resolve(window._supabase);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window._supabase) {
        clearInterval(interval);
        resolve(window._supabase);
      } else if (attempts > 50) { // 5 second timeout
        clearInterval(interval);
        reject(new Error('Supabase failed to load. Please check your connection and refresh.'));
      }
    }, 100);
  });
}

// ── Check session on page load ─────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const db = await getSupabase();
    const { data: { session } } = await db.auth.getSession();
    if (session) showDashboard(session.user);

    db.auth.onAuthStateChange((_event, session) => {
      if (session) showDashboard(session.user);
      else showAuthForms();
    });
  } catch (e) {
    showMessage(e.message, 'error');
  }
});

// ── Tab switching ─────────────────────────────
function switchTab(tab) {
  document.getElementById('loginForm').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('resetForm').style.display  = 'none';
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
  clearMessage();
}

function showResetForm() {
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('resetForm').style.display  = 'block';
  clearMessage();
}

// ── Login ─────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) return showMessage('Please enter your email and password.', 'error');

  setLoading('loginBtn', true, 'Signing in…');
  try {
    const db = await getSupabase();
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) showMessage(error.message, 'error');
  } catch (e) {
    showMessage(e.message, 'error');
  }
  setLoading('loginBtn', false, 'Sign In');
}

// ── Signup ────────────────────────────────────
async function handleSignup() {
  const firstName = document.getElementById('signupFirst').value.trim();
  const lastName  = document.getElementById('signupLast').value.trim();
  const email     = document.getElementById('signupEmail').value.trim();
  const password  = document.getElementById('signupPassword').value;

  if (!firstName || !lastName || !email || !password)
    return showMessage('Please fill in all fields.', 'error');
  if (password.length < 6)
    return showMessage('Password must be at least 6 characters.', 'error');

  setLoading('signupBtn', true, 'Creating account…');
  try {
    const db = await getSupabase();
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } }
    });

    if (error) {
      showMessage(error.message, 'error');
    } else {
      // Save profile
      if (data.user) {
        await db.from('profiles').insert([{
          id: data.user.id,
          first_name: firstName,
          last_name: lastName
        }]);
      }
      showMessage('✅ Account created! Please check your email to confirm your account before signing in.', 'success');
    }
  } catch (e) {
    showMessage(e.message, 'error');
  }
  setLoading('signupBtn', false, 'Create Account');
}

// ── Password Reset ────────────────────────────
async function handleReset() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) return showMessage('Please enter your email address.', 'error');

  try {
    const db = await getSupabase();
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login.html'
    });
    if (error) showMessage(error.message, 'error');
    else showMessage('✅ Reset link sent! Check your email inbox.', 'success');
  } catch (e) {
    showMessage(e.message, 'error');
  }
}

// ── Sign Out ──────────────────────────────────
async function handleSignout() {
  try {
    const db = await getSupabase();
    await db.auth.signOut();
  } catch (e) {
    console.error(e);
  }
  showAuthForms();
}

// ── UI helpers ────────────────────────────────
function showDashboard(user) {
  document.getElementById('authForms').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.querySelector('.auth-back').style.display = 'none';

  const name = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user.email;

  document.getElementById('dashboardEmail').textContent = name;

  const joined = new Date(user.created_at);
  document.getElementById('memberSince').textContent = joined.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function showAuthForms() {
  document.getElementById('authForms').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  document.querySelector('.auth-back').style.display = 'block';
}

function showMessage(msg, type) {
  const el = document.getElementById('authMessage');
  el.textContent = msg;
  el.className = `auth-message ${type}`;
  el.style.display = 'block';
}

function clearMessage() {
  document.getElementById('authMessage').style.display = 'none';
}

function setLoading(btnId, loading, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = text;
}

// Expose functions globally
window.handleLogin   = handleLogin;
window.handleSignup  = handleSignup;
window.handleReset   = handleReset;
window.handleSignout = handleSignout;
window.switchTab     = switchTab;
window.showResetForm = showResetForm;
