/* ═══════════════════════════════════════════════════════
   AUTH — Google SSO, session management
   Domain restriction: @connect.inc
   Session timeout: 1 hour of inactivity
   ═══════════════════════════════════════════════════════ */

const AUTH = (() => {
  const DOMAIN       = 'connect.inc';
  const SESSION_KEY  = 'helios_session';
  const TIMEOUT_MS   = 60 * 60 * 1000; // 1 hour
  let   _timer       = null;

  /* ── Persist / read session ─────────────────────────── */
  function saveSession(user) {
    const session = { user, ts: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() - s.ts > TIMEOUT_MS) { clearSession(); return null; }
      return s;
    } catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    if (_timer) clearTimeout(_timer);
    _timer = null;
  }

  /* ── Activity timer — reset on any interaction ──────── */
  function resetTimer() {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(() => {
      clearSession();
      window.location.href = 'index.html?reason=timeout';
    }, TIMEOUT_MS);
    // Update timestamp
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        s.ts = Date.now();
        localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      } catch {}
    }
  }

  function startActivityWatcher() {
    ['click','keydown','mousemove','touchstart','scroll'].forEach(ev => {
      document.addEventListener(ev, resetTimer, { passive: true });
    });
    resetTimer();
  }

  /* ── Google credential callback ─────────────────────── */
  function handleCredential(response) {
    try {
      // Decode JWT payload (no verification needed — Google already verified)
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const email   = payload.email || '';
      const domain  = email.split('@')[1] || '';

      if (domain !== DOMAIN) {
        showAuthError(`Acceso restringido a cuentas @${DOMAIN}`);
        return;
      }

      const user = {
        email,
        name:    payload.name || email,
        picture: payload.picture || '',
        sub:     payload.sub,
      };

      saveSession(user);
      // Redirect to app
      window.location.href = 'app.html';
    } catch (e) {
      showAuthError('Error al verificar credenciales. Intenta de nuevo.');
    }
  }

  function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  /* ── Guard: call on app.html to verify session ──────── */
  function guard() {
    const s = getSession();
    if (!s) {
      window.location.href = 'index.html?reason=noauth';
      return null;
    }
    startActivityWatcher();
    return s.user;
  }

  /* ── Logout ──────────────────────────────────────────── */
  function logout() {
    clearSession();
    // Revoke Google token
    if (window.google && window.google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
    window.location.href = 'index.html';
  }

  return { handleCredential, guard, logout, getSession, clearSession };
})();
