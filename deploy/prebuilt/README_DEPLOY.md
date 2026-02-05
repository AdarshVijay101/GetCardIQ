# GetCardIQ (Prebuilt Docker Run)

## What this is
Prebuilt Docker images + compose so you can run without building source.

## Prereqs
- Docker Desktop installed

## Files you need in this folder
- docker-compose.prebuilt.yml
- .env  (copy from .env.example)
- Optional: getcardiq-images.tar (if offline)

## Option A: Run from Registry (Recommended)
This method downloads pre-built images from GitHub Container Registry.

1. **Authentication (If Private)**
   If the repository is private, you must login to GHCR first:
   ```powershell
   echo $env:GHCR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
   ```

2. **Run Setup**
   ```powershell
   powershell ./setup.ps1
   ```
   *(The script automatically detects if `getcardiq-images.tar` is missing and defaults to pulling from Registry)*

## Option B: Run from Offline Tarball
If you have `getcardiq-images.tar` (e.g. from USB or Release), place it in this folder.
1. Run `powershell ./setup.ps1`
2. It will detect the file and load images from disk.

## Environment Variables
The `.env` file requires the following keys:
- **Required**: `DATABASE_URL`, `DATABASE_URL_DEMO` (pre-filled), `PLAID_CLIENT_ID`, `PLAID_SECRET`.
- **Required for AI**: `GEMINI_API_KEY` (for Money Left Behind & Insights).
- **Optional**: `GCP_ENCRYPTION_...` (if using cloud sync).

## 🛠️ For Admin: How to Push Images
If you are the developer distributing this, here is how to build and push the images safely.

**1. Login to GHCR**
```powershell
$env:GHCR_USER = "AdarshVijay101"
$env:GHCR_TOKEN = "YOUR_GITHUB_PAT" # Scopes: read:packages, write:packages
echo $env:GHCR_TOKEN | docker login ghcr.io -u $env:GHCR_USER --password-stdin
```

**2. Build & Tag**
```powershell
# Build normal latest tags
docker compose build

# Tag for Registry (Version: v1.0-prebuilt)
docker tag getcardiq-server:latest ghcr.io/adarshvijay101/getcardiq-server:v1.0-prebuilt
docker tag getcardiq-client:latest ghcr.io/adarshvijay101/getcardiq-client:v1.0-prebuilt
docker tag getcardiq-python_api:latest ghcr.io/adarshvijay101/getcardiq-python_api:v1.0-prebuilt
```

**3. Push**
```powershell
docker push ghcr.io/adarshvijay101/getcardiq-server:v1.0-prebuilt
docker push ghcr.io/adarshvijay101/getcardiq-client:v1.0-prebuilt
docker push ghcr.io/adarshvijay101/getcardiq-python_api:v1.0-prebuilt
```

---

## One-command setup (User)
1. Copy `.env.example` to `.env` and fill values.
2. Run `powershell ./setup.ps1`

## Manual run (Registry)
```powershell
docker compose -f docker-compose.registry.yml pull
docker compose -f docker-compose.registry.yml up -d
```
Then run schema push commands manually (see setup.ps1).

