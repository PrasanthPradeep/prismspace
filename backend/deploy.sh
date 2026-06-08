#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}🚀 Prism Space Backend Deployment Script${NC}\n"

# ─── 1. Pre-flight checks ────────────────────────────────────────────────────
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: 'gcloud' CLI is not installed.${NC}"
    echo -e "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Ensure user is authenticated
ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo -e "${YELLOW}Not authenticated with gcloud. Initiating login...${NC}"
    gcloud auth login
fi

# ─── 2. Load secrets from .env ───────────────────────────────────────────────
# Load backend/.env if it exists (for local development)
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}Loading secrets from ${BOLD}.env${NC}..."
    # Export only lines that are not comments and contain '='
    set -a
    # shellcheck disable=SC1090
    source <(grep -v '^\s*#' "$ENV_FILE" | grep '=')
    set +a
fi

# ─── 3. Configuration Setup ───────────────────────────────────────────────────
DEFAULT_PROJECT="prismspace-extension"
if [ -f "../.firebaserc" ]; then
    PROJECT_FROM_RC=$(grep -o '"default": "[^"]*' ../.firebaserc | cut -d'"' -f4)
    if [ -n "$PROJECT_FROM_RC" ]; then
        DEFAULT_PROJECT="$PROJECT_FROM_RC"
    fi
fi

read -p "Enter Google Cloud Project ID [$DEFAULT_PROJECT]: " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-$DEFAULT_PROJECT}

read -p "Enter Cloud Run Service Name [prismspace-backend]: " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-prismspace-backend}

read -p "Enter Deployment Region [asia-south1]: " REGION
REGION=${REGION:-asia-south1}

# ─── 4. Validate required secrets ─────────────────────────────────────────────
if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your-gemini-api-key-here" ]; then
    echo -e "${YELLOW}Warning: GEMINI_API_KEY is not set or is a placeholder.${NC}"
    read -p "Enter your Gemini API key (or press Enter to skip): " GEMINI_API_KEY_INPUT
    [ -n "$GEMINI_API_KEY_INPUT" ] && GEMINI_API_KEY="$GEMINI_API_KEY_INPUT"
fi

AI_PROVIDER=${AI_PROVIDER:-gemini}
AI_FALLBACK_PROVIDERS=${AI_FALLBACK_PROVIDERS:-groq,groq-proxy}

if [[ "$AI_PROVIDER" = "groq" || ",$AI_FALLBACK_PROVIDERS," = *",groq,"* ]]; then
    if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your-groq-api-key-here" ]; then
        echo -e "${YELLOW}Warning: Groq fallback is enabled but GROQ_API_KEY is not set or is a placeholder.${NC}"
        read -p "Enter your Groq API key (or press Enter to deploy without Groq fallback): " GROQ_API_KEY_INPUT
        [ -n "$GROQ_API_KEY_INPUT" ] && GROQ_API_KEY="$GROQ_API_KEY_INPUT"
    fi
fi

if [ -z "$EXTENSION_SECRET" ] || [ "$EXTENSION_SECRET" = "change-me-to-a-random-secret-string" ]; then
    echo -e "${YELLOW}Generating a new EXTENSION_SECRET...${NC}"
    EXTENSION_SECRET=$(openssl rand -hex 32)
    echo -e "${GREEN}Generated secret: ${BOLD}$EXTENSION_SECRET${NC}"
    echo -e "${YELLOW}⚠️  Save this — you'll need to put it in your root .env as VITE_EXTENSION_SECRET${NC}"
fi

# Set the active project
echo -e "\n${GREEN}Setting active gcloud project to ${BOLD}$PROJECT_ID${NC}..."
gcloud config set project "$PROJECT_ID"

# ─── 5. Build the container image using Cloud Build ───────────────────────────
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME"
echo -e "\n${GREEN}Building container image using Cloud Build: ${BOLD}$IMAGE_TAG${NC}..."
gcloud builds submit --tag "$IMAGE_TAG"

# ─── 6. Write env vars to a temp YAML file (avoids comma-in-value issues) ─────
# gcloud --set-env-vars splits on commas, so ALLOWED_ORIGINS with multiple
# origins breaks. --env-vars-file accepts YAML and handles commas in values.
ENV_VARS_FILE="$(mktemp /tmp/prism-env-XXXXXX.yaml)"
trap 'rm -f "$ENV_VARS_FILE"' EXIT

cat > "$ENV_VARS_FILE" << YAML
AI_PROVIDER: "$AI_PROVIDER"
AI_FALLBACK_PROVIDERS: "$AI_FALLBACK_PROVIDERS"
NODE_ENV: "production"
FIREBASE_PROJECT_ID: "$PROJECT_ID"
RATE_LIMIT_MAX: "${RATE_LIMIT_MAX:-30}"
RATE_LIMIT_WINDOW_MS: "${RATE_LIMIT_WINDOW_MS:-60000}"
YAML

[ -n "$GEMINI_API_KEY" ]   && echo "GEMINI_API_KEY: \"$GEMINI_API_KEY\""   >> "$ENV_VARS_FILE"
[ -n "$GEMINI_MODEL" ]     && echo "GEMINI_MODEL: \"$GEMINI_MODEL\""       >> "$ENV_VARS_FILE"
[ -n "$GROQ_API_KEY" ] && [ "$GROQ_API_KEY" != "your-groq-api-key-here" ] \
                           && echo "GROQ_API_KEY: \"$GROQ_API_KEY\""       >> "$ENV_VARS_FILE"
[ -n "$GROQ_MODEL" ]      && echo "GROQ_MODEL: \"$GROQ_MODEL\""           >> "$ENV_VARS_FILE"
[ -n "$GROQ_PROXY_URL" ]  && echo "GROQ_PROXY_URL: \"$GROQ_PROXY_URL\""   >> "$ENV_VARS_FILE"
[ -n "$EXTENSION_SECRET" ] && echo "EXTENSION_SECRET: \"$EXTENSION_SECRET\"" >> "$ENV_VARS_FILE"
[ -n "$ALLOWED_ORIGINS" ]  && echo "ALLOWED_ORIGINS: \"$ALLOWED_ORIGINS\"" >> "$ENV_VARS_FILE"

echo -e "\n${GREEN}Env vars file:${NC}"
sed -E 's/^(GEMINI_API_KEY|GROQ_API_KEY|EXTENSION_SECRET): .*/\1: "[redacted]"/' "$ENV_VARS_FILE"

# ─── 7. Deploy to Cloud Run ───────────────────────────────────────────────────
echo -e "\n${GREEN}Deploying to Google Cloud Run: ${BOLD}$SERVICE_NAME${NC}..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_TAG" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --env-vars-file "$ENV_VARS_FILE"

# ─── 8. Get deployed URL ──────────────────────────────────────────────────────
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)')

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BOLD}Backend URL:${NC} $SERVICE_URL"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Verify the backend is healthy:"
echo -e "   ${BOLD}curl $SERVICE_URL/health${NC}"
echo -e "2. Set VITE_BACKEND_URL in your root .env if the URL changed:"
echo -e "   ${BOLD}VITE_BACKEND_URL=$SERVICE_URL${NC}"
echo -e "3. Rebuild the extension if the URL changed:"
echo -e "   ${BOLD}pnpm run build${NC}"
