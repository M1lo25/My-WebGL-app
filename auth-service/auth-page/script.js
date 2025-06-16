// --- Toggle 'Mostra/Nascondi password' ---
const pwdInput = document.getElementById('password');
const toggle = document.getElementById('togglePassword');
toggle.addEventListener('click', () => {
  const type = pwdInput.type === 'password' ? 'text' : 'password';
  pwdInput.type = type;
  toggle.innerHTML = type === 'password'
    ? '<i class="fas fa-eye"></i>'
    : '<i class="fas fa-eye-slash"></i>';
});

// --- Validazione client-side ---
const form = document.getElementById('loginForm');
form.addEventListener('submit', e => {
  let valid = true;
  document.getElementById('userError').textContent = '';
  document.getElementById('passError').textContent = '';
  const serverErr = document.getElementById('serverError');
  serverErr.hidden = true;

  // Username/email
  const user = document.getElementById('username');
  if (!user.checkValidity()) {
    document.getElementById('userError').textContent = user.title;
    valid = false;
  }
  // Password
  const pass = document.getElementById('password');
  if (!pass.checkValidity()) {
    document.getElementById('passError').textContent = pass.title;
    valid = false;
  }

  if (!valid) e.preventDefault();
});

// --- Messaggi d'errore server-side via query string ---
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('error')) {
    const msgMap = {
      notfound: 'Utente non trovato.',
      wrongpass: 'Password errata.',
      blocked: 'Account bloccato. Contatta assistenza.'
    };
    const msg = msgMap[params.get('error')] || 'Credenziali errate, riprova.';
    const el = document.getElementById('serverError');
    el.textContent = msg;
    el.hidden = false;
  }
});
