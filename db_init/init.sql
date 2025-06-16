CREATE TABLE utenti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO utenti (username, password_hash)
VALUES ('pippo', SHA2('Greta123', 256));

SELECT id, username, password_hash, created_at
FROM utenti
WHERE username = 'pippo';