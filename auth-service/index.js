const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const app = express();

// 1. Static per la pagina di login/registrazione
app.use('/auth', express.static(path.join(__dirname, 'auth-page')));
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth-page', 'index.html'));
});

// 2. Body parser e session middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'un_tuo_secret_lungo_e_sicuro',  // tienilo segreto!
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

// 3. Lettura Docker secret per MySQL
const pwFile = process.env.MYSQL_ROOT_PASSWORD_FILE || '/run/secrets/db_root_pw';
if (!fs.existsSync(pwFile)) {
  console.error('ERRORE: file secret non trovato:', pwFile);
  process.exit(1);
}
const rootPassword = fs.readFileSync(pwFile, 'utf8').trim();

// 4. Pool di connessioni a MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'db',
  user: process.env.MYSQL_USER || 'root',
  password: rootPassword,
  database: process.env.MYSQL_DATABASE || 'mydb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 5. Login POST
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect('/auth/login?error=missing');
  }
  try {
    const [rows] = await pool.execute(
      'SELECT password_hash FROM utenti WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.redirect('/auth/login?error=notfound');
    }
    const sha256 = crypto.createHash('sha256').update(password).digest('hex');
    if (sha256 !== rows[0].password_hash) {
      return res.redirect('/auth/login?error=wrongpass');
    }
    // login OK
    req.session.user = username;
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.redirect('/auth/login?error=internal');
  }
});

// 6. Route protetta di root: redirige a /webgl o a login
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  return res.redirect('/webgl/');
});

// ────────────────────────────────────────────────────────────────────────────
// 7. Nuovo endpoint per la sub-request di Nginx (auth_request)
app.get('/auth/session-check', (req, res) => {
  if (req.session && req.session.user) {
    return res.sendStatus(200);
  }
  return res.sendStatus(401);
});

// 8. Logout: distrugge la sessione e reindirizza
app.get('/auth/logout', (req, res) => {
  req.session.destroy(err => {
    // non clearCookie(), basta distruggere la sessione
    return res.redirect('/auth/login');
  });
});

// 9. 404 generico
app.use((req, res) => {
  res.status(404).send('Pagina non trovata');
});

// 10. Avvio server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Auth Service in ascolto su porta ${PORT}`);
});
