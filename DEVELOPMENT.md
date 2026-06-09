# Prism Space - Developer Guide

This document provides a comprehensive guide for developers working on the **Prism Space** repository, covering everything from pre-installation requirements to local development, architecture, environment configuration, credentials management, testing, and deployment.

---

## 1. Repository Architecture

Prism Space is structured as a multi-component workspace, featuring a browser extension frontend and an AI-adapter backend:

*   **Frontend (Root Directory):** A React-based browser extension built with **WXT** (Web Extension Framework), TypeScript, and TailwindCSS.
*   **Backend (`/backend`):** An Express-based TypeScript server that acts as a secure proxy and abstraction layer for AI APIs (Google Gemini, Groq), running on Google Cloud Run.
*   **Legacy Assets (`/legacy-static`, `/components/legacy`):** Pre-existing static HTML/JS resources that are loaded dynamically or bridged with the extension environment.

---

## 2. Prerequisites & Pre-installation

Before you start, make sure you have the following installed on your machine:

1.  **Node.js** (v18.x or newer recommended)
2.  **pnpm** (v11.1.3, specified as the repository package manager)
3.  **Google Cloud SDK (`gcloud` CLI)** - Required if you are deploying or managing the backend service.
4.  **Firebase CLI** (`npx -y firebase-tools@latest`) - Required for configuring Firestore rules.
5.  **Git** - For version control.

---

## 3. Local Development Setup

To get a local instance of both the browser extension and the backend running:

### Step 1: Install Dependencies
Run the following command at the root of the workspace to install all dependencies for both the frontend extension and the backend:

```bash
pnpm install
```

### Step 2: Configure Environment Variables
You need to set up environment configurations for both the extension and the backend:

1.  **Extension Frontend:**
    Copy the `.env.example` in the root directory to `.env`:
    ```bash
    cp .env.example .env
    ```
    Configure the following variables in the root `.env`:
    *   `VITE_BACKEND_URL`: The URL of your backend server (e.g., `http://localhost:8080` for local dev).
    *   `VITE_EXTENSION_SECRET`: A secure shared secret key that matches the backend's secret.
    *   `VITE_CHROME_CLIENT_ID`: The Google OAuth 2.0 Client ID for user authentication in Chrome.

2.  **AI Backend Service:**
    Navigate to the `backend/` directory and copy its `.env.example`:
    ```bash
    cd backend
    cp .env.example .env
    ```
    Configure the key variables in `backend/.env` (see section 4 for details).

### Step 3: Run the Services

*   **To run the Extension locally:**
    From the root directory, start the WXT development server:
    ```bash
    # For Chrome (loads extension in a new clean Chrome window automatically)
    pnpm run dev
    
    # For Firefox
    pnpm run dev:firefox
    ```

*   **To run the Backend locally:**
    From the `backend/` directory, start the TypeScript live-reload watcher:
    ```bash
    cd backend
    pnpm run dev
    ```
    This launches the API backend on `http://localhost:8080` (or the `PORT` specified in your `.env`).

---

## 4. Configuration & Environment Variables

### Root Extension `.env` File
| Variable Name | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | URL endpoint of the Express backend | `http://localhost:8080` |
| `VITE_EXTENSION_SECRET` | 32+ character hex string for API request authentication | `f334dacd86865ae0bc1...` |
| `VITE_CHROME_CLIENT_ID` | OAuth2 client ID configured in Google Cloud Console | `403796056253-o67h74...apps.googleusercontent.com` |

> [!NOTE]
> WXT uses a custom plugin inside [wxt.config.ts](file:///home/prashu/Projects/prismspace/wxt.config.ts) called `injectBackendSecrets` to patch the static asset `public/converted-inline/prism-backend-adapter.js` with the correct `BACKEND_URL` and `EXTENSION_SECRET` at build time.

### Backend `.env` File
| Variable Name | Description | Example / Default |
| :--- | :--- | :--- |
| `AI_PROVIDER` | Primary AI API provider to use (`gemini`, `groq`, or `groq-proxy`) | `gemini` |
| `AI_FALLBACK_PROVIDERS` | Comma-separated list of fallback providers | `groq,groq-proxy` |
| `GEMINI_API_KEY` | Google AI Studio API key | `AIzaSy...` |
| `GEMINI_MODEL` | Google Gemini model to use | `gemini-2.0-flash` |
| `GROQ_API_KEY` | Groq Console API Key | `gsk_...` |
| `GROQ_MODEL` | Groq Model to use | `openai/gpt-oss-120b` |
| `PORT` | Listening port for the server | `8080` |
| `EXTENSION_SECRET` | Shared secret header verification token (`X-Prism-Secret`) | (Must match frontend's `VITE_EXTENSION_SECRET`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed browser extension origins | `chrome-extension://YOUR_ID,moz-extension://YOUR_ID` |
| `RATE_LIMIT_MAX` | Maximum API requests per window per IP | `30` |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting duration window (milliseconds) | `60000` (1 minute) |

---

## 5. Credentials & Secrets Management

To maintain security, keep the following protocols in mind:

### Changing or Rotating `EXTENSION_SECRET`
If you suspect the `EXTENSION_SECRET` has been leaked or you want to rotate it:
1.  Generate a new random 32-byte hex key:
    ```bash
    openssl rand -hex 32
    ```
2.  Update `VITE_EXTENSION_SECRET` in the root `.env` for the extension.
3.  Update `EXTENSION_SECRET` in the `backend/.env` file.
4.  Re-deploy the backend service (so Cloud Run runs with the new secret).
5.  Rebuild and distribute the updated extension. Older extensions will fail to authenticate with the new backend.

### Google OAuth 2.0 Credentials
*   For Chrome, the Google sign-in depends on the Client ID. If changing client IDs, update the `oauth2.client_id` in `wxt.config.ts` or through your `VITE_CHROME_CLIENT_ID` environment variable.
*   Make sure the extension ID of your production extension is added to the Google Cloud Console's Authorized Origins/Redirect URIs under the OAuth Client settings.

---

## 6. Testing

### Backend Unit Tests
The backend contains a test suite built on Jest. Run tests via:
```bash
cd backend
pnpm run test
```

### Firestore Security Rules Validation
Firestore rules are defined in [firestore.rules](file:///home/prashu/Projects/prismspace/firestore.rules).
*   Any database structure updates must be reflected in the security rules.
*   Make sure to test rules using the Firebase Local Emulator Suite if changing them:
    ```bash
    firebase emulators:start --only firestore
    ```

---

## 7. Build and Package

### Frontend Extension Build
To build and package the production extension:
```bash
# Build production bundle (.output/chrome-mv3 and .output/firefox-mv3)
pnpm run build

# Create zipped bundles for uploading to Chrome Web Store and Firefox Add-ons
pnpm run zip
```
The output zip archives will be saved in the root folder as `prismspace-chrome.zip` and `prismspace-firefox.zip`.

### Backend Compilation
To build the backend production bundles manually:
```bash
cd backend
pnpm run build
```
This builds the TypeScript code to ES Modules output in `backend/dist`.

---

## 8. Deployment Guide

### Deploying the Backend to Google Cloud Run
The backend is deployed using Google Cloud Build and Cloud Run via the `backend/deploy.sh` script.

1.  Make sure you are logged in to `gcloud`:
    ```bash
    gcloud auth login
    ```
2.  Run the deployment script:
    ```bash
    cd backend
    ./deploy.sh
    ```
3.  The script will:
    *   Prompt you for your GCP Project ID, desired Service Name, and Region.
    *   Submit a container build to **Google Cloud Build** using the [Dockerfile](file:///home/prashu/Projects/prismspace/backend/Dockerfile).
    *   Generate a secure temporary YAML environment file to prevent comma-parsing errors in `gcloud` deployment (essential for `ALLOWED_ORIGINS` parsing).
    *   Deploy the built image to **Cloud Run** with unauthenticated access enabled.
    *   Output the new public backend service URL.
4.  If the service URL changed, copy it and update `VITE_BACKEND_URL` in the root `.env` and rebuild the extension.

### Deploying Firestore Rules
If you have updated [firestore.rules](file:///home/prashu/Projects/prismspace/firestore.rules), deploy them using:
```bash
npx firebase deploy --only firestore:rules
```

---

## 9. Pre-Release Checklist

Before uploading the zipped extension to store dashboards or launching the backend updates:

*   [ ] **Verify Extension Environment:** Ensure `VITE_BACKEND_URL` is pointing to the production Cloud Run URL (not `localhost`).
*   [ ] **CORS Origins Alignment:** Verify that `ALLOWED_ORIGINS` in the Cloud Run configuration includes the actual Chrome and Firefox Extension IDs.
*   [ ] **API Key Verification:** Ensure `GEMINI_API_KEY` and other production fallbacks are active in GCP Secret Manager or Cloud Run Environment.
*   [ ] **No Secrets in Version Control:** Double-check that `.env` files are not tracked by Git (`git status`).
*   [ ] **Build & Lint Verification:** Run `pnpm run lint` and ensure both Chrome and Firefox targets compile without errors.
*   [ ] **Google OAuth Consent Screen:** Check that the Chrome Web Store extension URL/ID is verified on the Google Cloud Console OAuth consent screen if scopes or user access levels have changed.
