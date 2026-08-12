<!-- PROJECT CHARLIE README -->
<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.128-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Flask-NLP_service-black?style=for-the-badge&logo=flask" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />
</p>

<h1 align="center">Project Charlie</h1>

<p align="center">
  <em>An internal toolkit for automating Oracle HCM Data Loader (HDL) workflows —
  Excel/DAT preparation, AI-assisted validation rules, Oracle submission and
  status tracking, and pre/post-load delta validation.</em>
</p>

---

## Overview

Project Charlie is a multi-service application built around **Oracle HCM Data
Loader (HDL)** file preparation and validation. It has four parts:

| Component | Tech | Path | Default port |
|---|---|---|---|
| **Backend API** | FastAPI (Python) | `Server/Main.py` | `8000` |
| **NLP microservice** | Flask + Google Gemini | `NLP/app.py` | `9000` |
| **Web frontend** | React 18 + MUI + Clerk | `frontend/charlie_client/` | `3000` (dev) / `80` (Docker/nginx) |
| **Standalone desktop app** | pywebview + Polars | `StandaloneApp/` | offline, no server |

The backend is the system of record: it accepts customer HR data (Excel/`.dat`
files), maps and transforms it against HDL business-object schemas, applies
validation rules (static and AI-generated), submits load requests to Oracle,
polls job status, and runs a **post-validation "delta" engine** that diffs a
source dataset against a target/loaded dataset column-by-column to surface
discrepancies at scale (Polars-backed, tested against 600k+ row datasets).

The NLP microservice is a separate Flask process that uses the Gemini API to
turn a natural-language rule description into runnable Python validation
code, which the backend then stores per customer/instance/attribute.

The React frontend is a multi-page console (Dashboard, HDL upload/transform,
Hierarchy explorer, Post-Validation, Configuration, Onboarding) authenticated
via **Clerk**, calling the backend's `/api/*` routes.

`StandaloneApp/` ships the same delta-comparison engine as a single-file
Windows `.exe` with no server, no browser, and no network calls — for
running post-validation entirely offline. See
[`StandaloneApp/README.md`](StandaloneApp/README.md) for details.

A desktop **launcher** (`launcher/launcher.py`, `pystray`-based) can start
and manage all local services from a system-tray icon instead of running
each one by hand.

---

## Repository structure

```
Project_Charlie_Main/
├── Server/                  # FastAPI backend — the main API
│   ├── Main.py              #   ~11k lines: HDL upload/transform, post-validation,
│   │                        #   Oracle submission/status, customer/instance config, admin
│   ├── models.py            #   Pydantic models
│   ├── Required_files/      #   HDL business-object schemas, static NLR rule sheets
│   ├── uploads/              #   Runtime: uploaded + generated files
│   └── Dockerfile
│
├── NLP/                     # Flask microservice — Gemini-powered rule generation
│   ├── app.py                #   /health, /, /validate
│   ├── templates/            #   Standalone validation UI for this service
│   └── Dockerfile
│
├── frontend/charlie_client/ # React app (Create React App)
│   ├── src/Pages/            #   Dashboard, HDL, Hierarchy, Post_Validation,
│   │                        #   Configuration, Onboarding
│   ├── src/services/         #   API client (attaches Clerk JWT to requests)
│   ├── src/auth/              #   Clerk integration
│   └── Dockerfile / nginx.conf
│
├── StandaloneApp/            # Offline Windows desktop build of the delta engine
│   ├── validation_core.py    #   Dependency-free port of Server's post-validation logic
│   ├── desktop_app.py         #   pywebview host
│   └── webapp/                #   Vanilla HTML/CSS/JS UI
│
├── launcher/                  # System-tray launcher that runs all services locally
├── scripts/                    # One-off ops scripts (e.g. Clerk JWT template setup)
├── Required_files/             # Shared HDL schema / rule reference files
├── docker-compose.yml           # backend + nlp + frontend(nginx), with healthchecks
├── render.yaml                  # Render.com deploy config (backend + NLP as web services)
├── main.py                      # Minimal standalone FastAPI static-file server (demo)
└── installation_*.bat / *.command   # Per-service one-click setup scripts
```

---

## Prerequisites

- **Node.js** ≥ 18 and npm
- **Python** ≥ 3.10
- **Docker** + Docker Compose *(optional but recommended for full-stack runs)*
- A **Gemini API key** (`GEMINI_API_KEY`) if you want AI-assisted rule
  generation / column mapping — the app degrades gracefully without one
- A **Clerk** account/publishable key if you want authentication enabled
  (`CLERK_JWT_REQUIRED=true`) — otherwise it can run without auth in dev

---

## Setup

### Option 1 — Docker Compose (recommended for a full local stack)

```bash
cp .env.example .env   # fill in the values you need (see Configuration below)
docker compose up --build
```

This builds and runs all three networked services (`backend`, `nlp`,
`frontend`) with healthchecks; the frontend (nginx) is exposed on
`http://localhost:80` and proxies `/api` to the backend.

### Option 2 — One-click scripts (Windows)

Run in this order:

1. `installation_NLP.bat` — sets up a venv and installs `NLP/requirements.txt`
2. `installation_backend.bat` (or `backend_setup.command` on macOS) — sets up
   a venv and installs `Server/Requirements.txt`
3. `installation_frontend.bat` (or `installation_frontend.command`) —
   `npm install` for `frontend/charlie_client`

Then start each service manually (see Option 3), or use the launcher.

### Option 3 — Manual, per service

```bash
# NLP microservice
cd NLP
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python app.py                      # http://localhost:9000

# Backend
cd Server
python -m venv .venv && .venv\Scripts\activate
pip install -r Requirements.txt
python Main.py                     # http://localhost:8000

# Frontend
cd frontend/charlie_client
npm install
npm start                          # http://localhost:3000
```

### Option 4 — Desktop launcher

```bash
cd launcher
pip install -r requirements.txt
python launcher.py
```

Starts and supervises the backend/NLP/frontend from a system-tray icon
(compiles to a single `.exe`/`.app` via PyInstaller — see `launcher/build.sh`).

### Standalone offline desktop app (Delta Post-Validation only)

```bash
cd StandaloneApp
pip install -r requirements.txt
python desktop_app.py              # run from source
# or
build_exe.bat                      # produces dist\DeltaPostValidation.exe
```

No FastAPI server or browser involved — see
[`StandaloneApp/README.md`](StandaloneApp/README.md).

---

## Configuration

Copy `.env.example` to `.env` at the repo root (used by Docker Compose and
by `Server/Main.py` / `NLP/app.py` via `python-dotenv`).

| Variable | Purpose |
|---|---|
| `APP_ENV` | `development` or `production` — production enables fail-fast startup checks |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins allowed to call the backend |
| `ORACLE_USERNAME` / `ORACLE_PASSWORD` / `ORACLE_ENV` | Oracle HCM credentials used for HDL submission/status/lookup endpoints |
| `CLERK_JWT_REQUIRED` | `true` to enforce Clerk JWT validation on the backend |
| `CLERK_ISSUER` / `CLERK_AUDIENCE` / `CLERK_API_KEY` | Clerk issuer, optional audience claim, and server-side admin API key |
| `REACT_APP_API_URL` | Backend base URL baked into the frontend build (e.g. `http://localhost:8000/api`) |
| `REACT_APP_CLERK_PUBLISHABLE_KEY` / `REACT_APP_CLERK_JWT_TEMPLATE` | Frontend Clerk config |
| `GEMINI_API_KEY` | Enables Gemini-backed rule generation and AI column mapping (both backend and NLP service) |
| `OLLAMA_HOST` / `OLLAMA_MODEL` | Optional local-LLM fallback for the NLP service (Docker default: `host.docker.internal:11434`, model `mistral`) |

Per-customer Oracle environment credentials can also be stored/managed at
runtime through the app itself (`Required_files/env_store/`, and the
`/api/customers` / `/api/save-env` endpoints) rather than the global `.env`.

---

## API surface (backend, `Server/Main.py`)

Grouped by area — see `/docs` (Swagger UI) on the running backend for the
full interactive schema.

- **Utility / auth** — `GET /api/health`, `POST /api/utils/login-access`,
  `GET /api/utils/hdl/menu-items`, `GET /api/utils/hdl/stats`,
  `GET /api/utils/system-status`, `GET /api/utils/finance/menu-items`
- **Upload & transform** — `POST /api/hdl/upload-dat`,
  `/api/hdl/upload-excel`, `/api/hdl/upload`,
  `/api/hdl/apply-transformation-and-download`,
  `/api/hdl/transform-customer-excel`, `/api/hdl/data-transformation`,
  `/api/hdl/bulk-excel-upload`, `/excel`, `/convert-excel`
- **Validation rules & NLP** — `POST /api/hdl/nlp/batch` (fetch static rules
  from `Available_NLP.xlsx`), `POST /api/hdl/nlp/validate` (proxies to the
  Flask NLP service), `POST /api/hdl/save_code` / `GET /api/hdl/get_rules`
  (persist/retrieve generated Python validation code),
  `POST /api/hdl/validate-data`, `POST /api/validate-personname`,
  `POST /api/hdl/bulk/cross-file/personNumber/validate`,
  `POST /api/hdl/bulk/cross-file/legalEmployer/validate`
- **Post-validation (delta engine)** — `POST /api/excel/post_validation/validate`,
  `/validate_large` (large-dataset Polars path), `/data_mapping`,
  `/transform`, `GET /status/{job_id}`, `POST /cancel/{job_id}`,
  `GET /download/{job_id}`
- **Oracle integration** — `POST /api/hdl/upload-to-oracle`,
  `/api/hdl/trigger-oracle-job`,
  `GET /api/hdl/status/{customerName}/{instanceName}/{request_id}`,
  `GET /api/hdl/errors/{...}`, `/api/hdl/oracle_fetch/lookupdataload`,
  `/api/hdl/oracle_fetch/mandatoryFields`, `POST /api/oracle/value-check`
- **Customers / instances / environments** — full CRUD under
  `/api/customers`, `/api/env/customers`, `/api/hdl/save-setup`,
  `/api/hdl/save-attribute-mapping`
- **Precheck reports** — `GET /api/hdl/precheck/list`,
  `POST /api/hdl/precheck/reports/{fetch,upload,validate}`
- **AI column mapping** — `POST /api/hdl/gemini-map`,
  `/api/excel/columns/mapping` (+ async status polling)
- **Admin** — `POST /api/admin/reset-system`, `GET /api/admin/system-status`,
  plus (Clerk-gated) `/api/admin/clerk/users*`

The Flask NLP service (`NLP/app.py`) exposes `GET /health`, `GET /` (a
standalone validation UI at `NLP/templates/index.html`), and
`POST /validate`.

---

## Clerk authentication

The frontend obtains a Clerk-issued JWT (`getToken()`) and sends it as
`Authorization: Bearer <token>` on every `/api` request
(`frontend/charlie_client/src/services/api.js`); the backend validates it
against Clerk's JWKS endpoint using `PyJWT`/`PyJWKClient` and caches
validated tokens.

**Frontend** (`frontend/charlie_client/.env` / `.env.local`):
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
REACT_APP_CLERK_JWT_TEMPLATE=charlie tool
```

**Backend** (`Server/.env` or repo-root `.env`):
```
CLERK_JWT_REQUIRED=true
CLERK_ISSUER=https://your-instance-name.clerk.accounts.dev
CLERK_AUDIENCE=backend          # optional, if your JWT template sets `aud`
CLERK_API_KEY=                  # server secret; enables /api/admin/clerk/* endpoints
```

Notes:
- Ensure the Clerk JWT template surfaces role info (e.g. a `roles` claim, or
  mapped into `public_metadata`) so the backend's `require_roles()`
  dependency can enforce access on admin endpoints.
- In development, CORS defaults to permissive/localhost origins — restrict
  `ALLOWED_ORIGINS` for any production deployment.
- Never commit `.env` files or Clerk/Oracle/Gemini secrets to source control.
- `scripts/ensure_clerk_jwt_template.py` can create/verify the expected JWT
  template on the Clerk side.

---

## Deployment

- **Docker Compose** (`docker-compose.yml`) — self-contained local/prod
  stack: `backend` (FastAPI, healthcheck on `/api/health`), `nlp` (Flask +
  Gunicorn, healthcheck on `/health`), and `frontend` (nginx serving the CRA
  build, depends on both other services being healthy, published on `:80`).
  `docker-compose.override.yml` layers local-dev overrides on top.
- **Render** (`render.yaml`) — deploys the backend and NLP service as
  separate Docker web services; the backend's `NLP_SERVICE_URL` is wired
  automatically to the NLP service's Render URL. Oracle/Clerk/Gemini secrets
  and `ALLOWED_ORIGINS` are set via the Render dashboard (`sync: false`).
- **Vercel** — the React app also ships a `vercel.json`
  (`frontend/charlie_client/`) for deploying the frontend separately, with
  `REACT_APP_API_URL` pointed at the Render backend.

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `npm install` fails | Stale/corrupted cache | Delete `node_modules` + `package-lock.json`, rerun `npm install` |
| Python import errors | Venv not activated, or wrong Requirements file | Activate `.venv`, reinstall from the *service-specific* requirements file |
| CORS errors in the browser | Frontend origin not in `ALLOWED_ORIGINS` | Add the origin to the backend's `.env` and restart |
| 401s from the frontend | Clerk JWT missing/expired, or `CLERK_ISSUER` mismatch | Check Clerk dashboard config matches `CLERK_ISSUER`/`CLERK_AUDIENCE` |
| NLP calls fail | Flask service not running, or `NLP_SERVICE_URL` wrong | Confirm `NLP/app.py` is up on port `9000` and reachable from the backend |
| Large post-validation jobs slow/fail | Polars not installed, or file exceeds in-memory path | Install `polars`; use `/validate_large` for big datasets |
| Gemini features silently disabled | `GEMINI_API_KEY` unset | Set it in `.env` — the app runs fine without it, just without AI features |

---

## Development notes

- Backend entry: `Server/Main.py` (FastAPI, single large router module)
- NLP entry: `NLP/app.py` (Flask)
- Frontend entry: `frontend/charlie_client/src/index.js`; pages live in
  `src/Pages/`
- To produce a production frontend build: `cd frontend/charlie_client && npm run build`
  (output consumed either by the nginx Docker image or by the minimal
  static-file server in root `main.py`)
- No repo-level automated test suite currently ships with the backend
  (`Server/tests/` exists but is empty); the standalone app has a built-in
  `--selftest` mode (see `StandaloneApp/README.md`)

---

## License

No `LICENSE` file is currently present in this repository — treat the code
as proprietary/internal to the project owner unless a license is added.
