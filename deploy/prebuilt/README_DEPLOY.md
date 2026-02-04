# GetCardIQ (Prebuilt Docker Run)

## What this is
Prebuilt Docker images + compose so you can run without building source.

## Prereqs
- Docker Desktop installed

## Files you need in this folder
- docker-compose.prebuilt.yml
- .env  (copy from .env.example)
- getcardiq-images.tar  (provided separately)

## One-command setup
1) Copy `.env.example` to `.env` and fill values (especially AI keys if needed).
2) Run:

powershell ./setup.ps1

## Manual run (if you don't want the script)
docker load -i getcardiq-images.tar
docker compose -f docker-compose.prebuilt.yml up -d
docker compose -f docker-compose.prebuilt.yml exec server npx prisma db push
docker compose -f docker-compose.prebuilt.yml exec server node -e "process.env.DATABASE_URL=process.env.DATABASE_URL_DEMO; require('child_process').execSync('npx prisma db push', {stdio:'inherit'})"
docker compose -f docker-compose.prebuilt.yml exec server npm run seed:demo

Open:
- http://localhost:3000

Stop:
docker compose -f docker-compose.prebuilt.yml down

Reset DB:
docker compose -f docker-compose.prebuilt.yml down -v
