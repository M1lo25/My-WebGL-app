# Unity WebGL Dockerized App

## Overview
A lightweight Docker setup to serve a Unity WebGL build via Apache, protected by a Node.js login service and backed by MySQL, all routed through Nginx.

## Prerequisites
- Docker ≥ 19.03  
- Docker Compose ≥ 1.27  

## Getting Started
1. **Create secrets**  
   ```bash
   echo "your-db-root-password" > secrets/db_root_pw.txt
   echo "your-session-secret"  > secrets/session_secret.txt
   ```

2. **Database Initialization**
Add the following to your `db_init/init.sql` to create the **Test** user:
```sql
INSERT INTO utenti (username, password_hash)
VALUES ('Test', SHA2('Test1', 256));
```
MySQL will execute this script **only** when the db_data volume is empty.


1. **Resetting the Database**
To force re-execution of your updated `init.sql`, teardown and recreate the volume:
```sql
docker-compose down --volumes
docker-compose up -d
```
This will remove and recreate the `db_data` volume, causing MySQL to run your `init.sql` on startup.


3. **Build & run**
  ```bash
  docker-compose up --build
  ```

4. **Stop & clean**
  ```bash
  docker-compose down
  ```

## Architecture
- Nginx (port 80): reverse-proxy /webgl/ → Apache, /auth/ → auth-service
- Apache: serves /webgl/ content
- Auth Service (Node.js): handles login, uses MySQL
- MySQL: stores user credentials; initialized via db_init/init.sql

## Configuration
- Secrets injected via `*_FILE` env vars in `docker-compose.yml`
- Volumes for data & logs:
  - `webgl_data`
  - `db_data`
  - `nginx_logs`
  - `auth_logs`
