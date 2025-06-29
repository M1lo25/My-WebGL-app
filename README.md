# Unity WebGL Dockerized App

## Overview
A lightweight Docker setup to serve a Unity WebGL build via Apache, protected by a Node.js login service and backed by MySQL, all routed through Nginx.

## Architecture

- **Nginx (Port 80):**  
  Acts as a reverse proxy, directing authentication traffic (`/auth/*`) to the Node.js service and WebGL requests (`/webgl/*`) to Apache with session checks.

- **Auth Service (Node.js, Port 3000):**  
  Handles user login and session validation, connecting to MySQL via Docker secrets for secure credential management.

- **WebGL Server (Apache httpd:2.4):**  
  Serves the Unity WebGL build under `/webgl/` and delivers static assets (`/css/`, `/img/`) for custom error pages.

- **MySQL (mysql:8.0):**  
  Stores user credentials in an `utenti` table (`username`, `password_hash`) and automatically initializes its schema and seed data on the first run.

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
      ```bash
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

## Configuration
- Secrets injected via `*_FILE` env vars in `docker-compose.yml`
- Volumes for data & logs:
  - `webgl_data`
  - `db_data`
  - `nginx_logs`
  - `auth_logs`
