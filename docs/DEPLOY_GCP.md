# Deploying Background Jobs to Google Cloud

GetCardIQ uses Cloud Cloud Scheduler to trigger background jobs (Sync, Weekly Summary) hosted on Cloud Run.

## Prerequisites
- Google Cloud Project with Cloud Run and Cloud Scheduler enabled.
- The `server` application deployed to Cloud Run (url: `SERVICE_URL`).
- `SCHEDULER_KEY` environment variable set in Cloud Run secret/env configuration.

## 1. Sync Job (Every Hour)

Triggers the Plaid data sync.

**Command:**
```bash
gcloud scheduler jobs create http getcardiq-sync-job \
  --schedule="0 * * * *" \
  --uri="SERVICE_URL/api/jobs/sync" \
  --http-method=POST \
  --headers="Content-Type=application/json,X-Scheduler-Key=YOUR_SECRET_KEY" \
  --location=us-central1
```

## 2. Weekly Summary Job (Every Sunday at 9 AM)

Triggers the Rewards Intelligence Agent.

**Command:**
```bash
gcloud scheduler jobs create http getcardiq-weekly-summary \
  --schedule="0 9 * * 0" \
  --uri="SERVICE_URL/api/jobs/weekly-summary" \
  --http-method=POST \
  --headers="Content-Type=application/json,X-Scheduler-Key=YOUR_SECRET_KEY" \
  --location=us-central1
```

## Security Note
Ensure `X-Scheduler-Key` matches the `SCHEDULER_KEY` env var in Cloud Run.
Alternatively, configure OIDC authentication for Cloud Scheduler -> Cloud Run (recommended for enterprise).
