# InkFlow AI: Deployment Workflow

This guide covers how to deploy the full-stack InkFlow AI application to a Hetzner Cloud server.

## 1. Prerequisites
- A Hetzner Cloud VPS running Ubuntu (CX11 or higher recommended).
- Docker and Docker Compose installed on the server.

## 2. Preparation
1. **DNS Setup**: Log into your domain provider (e.g. GoDaddy, Namecheap) and create an **A Record** for `inkflow` pointing to your Hetzner server's public IP.
2. **Update API URL**: In the root `Dockerfile`, you can leave `VITE_API_URL` blank if using the provided Nginx proxy, as it will default to the same domain.

## 3. Deployment Steps
On your local machine, zip the project or push to a private Git repo. On your Hetzner server:

1. **Clone/Unzip** the project files.
2. **Navigate** to the project root.
3. **Start the containers**:
   ```bash
   docker compose up -d --build
   ```

## 4. Verification
- Frontend: `http://<YOUR_SERVER_IP>`
- Backend API: `http://<YOUR_SERVER_IP>:3001/api`

## 5. Persistence
The SQLite database is stored in `server/prisma/dev.db`. To move to a production PostgreSQL database, update the `DATABASE_URL` in the `docker-compose.yml` environment variables and change the provider in `schema.prisma`.
