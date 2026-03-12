#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for ARC (Cloud Run backend + Firebase Hosting frontend).
# Edit values below if your project/region/service names change.
PROJECT_ID="automated-review-companion"
REGION="us-central1"
SERVICE_NAME="arc-backend"
BACKEND_SOURCE="./publication-scraper-backend"
FRONTEND_DIR="./publication-scraper-web"

echo "[1/5] Setting project"
gcloud config set project "$PROJECT_ID"

echo "[2/5] Fixing Cloud Run source-build IAM (safe to re-run)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
BUILD_SA="$(gcloud builds get-default-service-account)"
RUN_SERVICE_AGENT="service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/run.builder" \
  --quiet

gcloud iam service-accounts add-iam-policy-binding "$BUILD_SA" \
  --member="serviceAccount:${RUN_SERVICE_AGENT}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

echo "[3/5] Deploying backend (Cloud Run)"
gcloud run deploy "$SERVICE_NAME" \
  --source "$BACKEND_SOURCE" \
  --region "$REGION" \
  --allow-unauthenticated \
  --quiet

echo "[4/5] Building frontend"
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "[5/5] Deploying frontend (Firebase Hosting)"
cd ..
firebase deploy --only hosting

echo
echo "Done."
echo "Backend URL: $(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
