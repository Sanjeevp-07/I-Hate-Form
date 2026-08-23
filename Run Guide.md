# 📘 I Hate Form — Complete Run & Setup Guide

Welcome to the **I Hate Form** (Internship Application Copilot) platform guide. This document provides step-by-step instructions on setting up, running, building, and deploying both the **Web Application Dashboard** and the **AI-Powered Chrome Extension**.

---

## 📑 Table of Contents
1. [System Requirements & Prerequisites](#1-system-requirements--prerequisites)
2. [Project Architecture](#2-project-architecture)
3. [Environment Configuration (.env)](#3-environment-configuration-env)
4. [Installation & Setup](#4-installation--setup)
5. [Running the Application Locally](#5-running-the-application-locally)
6. [Building & Installing the Chrome Extension](#6-building--installing-the-chrome-extension)
7. [How to Use the Chrome Extension](#7-how-to-use-the-chrome-extension)
8. [Admin Panel & Database Management](#8-admin-panel--database-management)
9. [Important Commands Cheat Sheet](#9-important-commands-cheat-sheet)
10. [Troubleshooting & Common Fixes](#10-troubleshooting--common-fixes)

---

## 1. System Requirements & Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: `v18.18.0` or higher (`node -v`)
- **pnpm**: `v9.0.0` or higher (`pnpm -v`)
  - If pnpm is not installed: `npm install -g pnpm`
- **Browser**: Google Chrome, Brave, Microsoft Edge, or any Chromium-based browser supporting Manifest V3 Side Panels.

---

## 2. Project Architecture

The project is structured as a high-performance **Turborepo monorepo**:

```
I Hate Form/
├── apps/
│   ├── web/               # Next.js 14 Web Dashboard & REST/AI APIs (Port 3000 / 3001)
│   └── extension/         # Chrome Extension MV3 with Side Panel UI & DOM Content Scripts
├── packages/
│   ├── ai/                # NVIDIA NIM AI integration & field classification pipeline
│   ├── database/          # JSON & SQL multi-tenant database store & logging
│   ├── types/             # Shared TypeScript interfaces & types
│   ├── validation/        # Zod validation schemas
│   └── config/            # Shared constants, models, and confidence thresholds
├── data/
│   └── ihateform-database.json  # Local persistent database store
├── tests/                 # Vitest automated test suite (Phases 1–5)
└── Run Guide.md           # This execution and command guide
```

---

## 3. Environment Configuration (`.env`)

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Ensure your `.env` contains the following settings:

```env
# ==============================================================================
# NVIDIA NIM AI Configuration (Free Open-Source LLMs)
# Get a free key at: https://build.nvidia.com/
# ==============================================================================
NVIDIA_API_KEY="nvapi-your-key-here"
AI_BASE_URL="https://integrate.api.nvidia.com/v1"

# Tiered Open-Source Models
AI_FAST_MODEL="meta/llama-3.1-8b-instruct"
AI_WORKHORSE_MODEL="meta/llama-3.1-70b-instruct"
AI_REASONING_MODEL="deepseek-ai/deepseek-r1"

# Database & App URLs
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/internship_copilot?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication Secrets
AUTH_SECRET="your-secure-32-character-secret-key"
EXTENSION_JWT_SECRET="your-extension-jwt-secret-key"

# Document & Resume Storage (Optional S3 / Cloudflare R2)
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="internship-copilot-resumes"
S3_REGION="auto"
```

---

## 4. Installation & Setup

1. Clone the repository and navigate into the project directory:
   ```bash
   cd "I Hate Form"
   ```

2. Install all dependencies across all workspaces:
   ```bash
   pnpm install
   ```

---

## 5. Running the Application Locally

### Option A: Run Everything Concurrently (Recommended)
```bash
pnpm dev
```
This command starts both the **Next.js Web Dashboard** (on `http://localhost:3000` or `http://localhost:3001`) and runs the extension watcher.

### Option B: Run Only the Web Dashboard
```bash
pnpm --filter @internship-copilot/web dev
```
Open your browser and navigate to:
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Profile & Autofill Data**: [http://localhost:3000/profile](http://localhost:3000/profile)
- **Resumes & Docs**: [http://localhost:3000/resumes](http://localhost:3000/resumes)
- **Database Inspector (Admin)**: [http://localhost:3000/database](http://localhost:3000/database)
- **Users Directory (Admin)**: [http://localhost:3000/users](http://localhost:3000/users)

---

## 6. Building & Installing the Chrome Extension

Whenever you make changes to the extension code, build the extension distribution bundle:

```bash
pnpm --filter @internship-copilot/extension build
```

### Loading the Extension in Google Chrome:
1. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
2. Enable **"Developer mode"** using the toggle in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left corner.
4. Select the directory:
   ```
   I Hate Form/apps/extension/dist
   ```
5. The **I Hate Form** extension icon will now appear in your browser extensions bar.

> 💡 **Tip**: Whenever you rebuild the extension, click the **Reload 🔄** icon on the extension card in `chrome://extensions`.

---

## 7. How to Use the Chrome Extension

1. **Sign In**:
   - Open the web dashboard at `http://localhost:3000/profile`.
   - Update and save your details (Name, Contact, Gender, Nationality, Address, Links).
2. **Open the Side Panel**:
   - Click the **I Hate Form** extension icon in your Chrome toolbar.
   - The side panel will open and display `Cloud Sync Active` with your saved profile.
3. **Scan Any Job Application Form**:
   - Navigate to any job application page (e.g. Jakson, Greenhouse, Lever, Workday, TurboHire).
   - Click **"Scan Fields"**.
   - The extension will detect all form fields with match confidence (98–99%).
4. **Autofill in One Click**:
   - Click **"Autofill Valid"**.
   - All text inputs, textareas, date fields, and dropdowns (Country Code, Gender, Nationality, Country, State) will be filled instantly!

---

## 8. Admin Panel & Database Management

### Master Admin Access:
- The Master Admin email is configured to: **`sanjeev1803t@gmail.com`**.
- When logged in with this email, the sidebar unlocks the **ADMIN RESTRICTED** section:
  - **Database Inspector (`/database`)**: Real-time view of JSON & SQL databases, registered users, and active sessions.
  - **Users & Members (`/users`)**: Multi-tenant user directory management.

### Database Persistence:
- Primary persistent storage is located in `data/ihateform-database.json`.
- Changes made via the Profile page or API are written directly to disk.

---

## 9. Important Commands Cheat Sheet

| Task | Command | Description |
|---|---|---|
| **Start Dev Server** | `pnpm dev` | Starts monorepo dev servers concurrently |
| **Start Web App Only** | `pnpm --filter @internship-copilot/web dev` | Starts only the Next.js frontend and APIs |
| **Build Chrome Extension** | `pnpm --filter @internship-copilot/extension build` | Compiles extension into `apps/extension/dist` |
| **Run Unit & E2E Tests** | `pnpm test` or `pnpm vitest run` | Runs test suite across all 5 verification phases |
| **Typecheck Monorepo** | `pnpm typecheck` | Runs TypeScript compiler checks across all packages |
| **Clean Build Artifacts** | `pnpm clean` | Cleans `.turbo`, `.next`, `dist`, and cache folders |

---

## 10. Troubleshooting & Common Fixes

### 1. `Uncaught SyntaxError: Identifier 'l' has already been declared`
- **Cause**: An older build of the extension was injected into the tab.
- **Fix**: Rebuild with `pnpm --filter @internship-copilot/extension build` and click the **Reload 🔄** button on `chrome://extensions`.

### 2. `Dropdown selecting wrong country code (e.g. Bolivia +591 instead of India +91)`
- **Cause**: Outdated dropdown matcher.
- **Fix**: Ensure the latest build is loaded. The new scoring algorithm prioritizes exact matches (`+91` / `India (+91)`).

### 3. `Port 3000 in use`
- Next.js will automatically fall back to port `3001`. Access the dashboard at `http://localhost:3001`.

### 4. `NVIDIA AI Classification Unavailable`
- Check that your `NVIDIA_API_KEY` in `.env` is valid. Free keys can be generated at [build.nvidia.com](https://build.nvidia.com/).

---

*Enjoy automated, zero-effort job applications with **I Hate Form**!* 🚀
