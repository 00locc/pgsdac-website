// ── Supabase Config ───────────────────────────
const SUPABASE_URL = 'https://qvhgdphephppshhvzaqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2aGdkcGhlcGhwcHNoaHZ6YXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTkxODAsImV4cCI6MjA5MDQ3NTE4MH0.1UtrUIEgzw4-2bksyh1m3SMtv8tNpXql9UjUmNosolQ';

(function loadSupabase() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  script.onload = () => {
    try {
      window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.dispatchEvent(new Event('supabase-ready'));
    } catch (e) {
      console.error('Supabase init failed:', e);
    }
  };
  script.onerror = () => console.error('Failed to load Supabase SDK');
  document.head.appendChild(script);
})();
