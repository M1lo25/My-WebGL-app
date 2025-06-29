const express = require('express')
const mysql   = require('mysql2/promise')
const session = require('express-session')
const crypto  = require('crypto')
const path    = require('path')
const fs      = require('fs')

const app = express()

// Serve il CSS della 403 page
app.use(
  '/css',
  express.static(path.join(__dirname, '..', 'web_data', 'css'))
);

// Serve l'immagine di sfondo
app.use(
  '/img',
  express.static(path.join(__dirname, '..', 'web_data', 'img'))
);

// Path per cartella web_data contenente 403.html
const webDataFolder = path.join(__dirname, '..', 'web_data')

// Lettura secret sessione
const sessFile = process.env.SESSION_SECRET_FILE || '/run/secrets/session_secret'
if (!fs.existsSync(sessFile)) {
  console.error('ERRORE: session secret non trovato:', sessFile)
  process.exit(1)
}
const sessionSecret = fs.readFileSync(sessFile, 'utf8').trim()

// Lettura password DB root
const pwFile = process.env.MYSQL_ROOT_PASSWORD_FILE || '/run/secrets/db_root_pw'
if (!fs.existsSync(pwFile)) {
  console.error('ERRORE: file secret non trovato:', pwFile)
  process.exit(1)
}
const rootPassword = fs.readFileSync(pwFile, 'utf8').trim()

// Middleware per parsing form
app.use(express.urlencoded({ extended: true }))

// Configurazione sessione
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}))

// Middleware che disabilita la cache sui file HTML/WebGL
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
}

// Static auth pages e login
app.use('/auth', express.static(path.join(__dirname, 'auth-page')))
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth-page', 'index.html'))
})

// Login POST
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.redirect('/auth/login?error=missing')
  }
  try {
    const [rows] = await pool.execute(
      'SELECT password_hash FROM utenti WHERE username = ?',
      [username]
    )
    if (rows.length === 0) {
      return res.redirect('/auth/login?error=notfound')
    }
    const hash = crypto.createHash('sha256').update(password).digest('hex')
    if (hash !== rows[0].password_hash) {
      return res.redirect('/auth/login?error=wrongpass')
    }
    req.session.user = username
    return res.redirect('/webgl/')
  } catch (err) {
    console.error(err)
    return res.redirect('/auth/login?error=internal')
  }
})

// Pool MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'db',
  user: process.env.MYSQL_USER || 'root',
  password: rootPassword,
  database: process.env.MYSQL_DATABASE || 'mydb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Cartella contenente build WebGL
const webglFolder = path.join(__dirname, '..', 'webgl')

// Protezione e serve file WebGL
app.use(
  '/webgl',
  noCache,                   
  (req, res, next) => {      
    if (!req.session.user) {
      return res.status(403).sendFile(path.join(webDataFolder, '403.html'))
    }
    next()
  },
  express.static(webglFolder, {
    index: 'index.html',
    redirect: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.gz')) {
        res.setHeader('Content-Encoding', 'gzip')
        if (filePath.endsWith('.js.gz'))   res.setHeader('Content-Type', 'application/javascript')
        if (filePath.endsWith('.data.gz')) res.setHeader('Content-Type', 'application/octet-stream')
        if (filePath.endsWith('.wasm.gz')) res.setHeader('Content-Type', 'application/wasm')
      }
      // forza max-age=0
      res.setHeader('Cache-Control', 'public, max-age=0')
    }
  })
)

// Fallback per tutte le route client-side sotto /webgl
app.get('/webgl/*', (req, res) => {
  if (!req.session.user) {
    return res.status(403).sendFile(path.join(webDataFolder, '403.html'))
  }
  res.sendFile(path.join(webglFolder, 'index.html'))
})

// Root redirect
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login')
  }
  res.redirect('/webgl/')
})

// Controllo sessione via API
app.get('/auth/session-check', (req, res) => {
  if (req.session && req.session.user) {
    return res.sendStatus(200)
  }
  return res.sendStatus(401)
})

// Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login')
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).send('Pagina non trovata')
})

// Avvio server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`Auth Service in ascolto su porta ${PORT}`)
})
