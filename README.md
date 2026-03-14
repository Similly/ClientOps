# ClientOps

ClientOps is a full-stack client portal for agencies, freelancers, consultants, and service businesses.
It provides role-based operations workflows for Admins, Team Members, and Clients in a polished SaaS-style UI.

## Product Concept

ClientOps centralizes delivery operations in one place:
- client relationships
- project execution
- task tracking
- service request intake
- document sharing
- activity visibility

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS (design-system style primitives)
- Prisma ORM + PostgreSQL
- NextAuth (credentials auth)
- Zod validation
- React Hook Form-ready validation layer
- TanStack Table-ready tabular patterns
- Vitest (unit/integration)
- Playwright (e2e login path)
- Docker + docker-compose

## Architecture Summary

- `app/`:
  - route groups for public login and protected app pages
  - server-rendered feature pages for dashboard, clients, projects, tasks, requests, documents, settings
  - API routes for NextAuth and secure document download
- `lib/`:
  - auth/session/db setup
  - RBAC helpers
  - validation schemas
  - file storage + activity logging
- `prisma/`:
  - relational schema
  - seed script with coherent demo data
- `components/`:
  - reusable UI primitives and layout shell (sidebar/topbar)
- `tests/`:
  - validator tests
  - authorization tests
  - CRUD service flow test
  - e2e login happy path

## Data Model

Implemented core relational models:
- `User`
- `Client`
- `Project`
- `ProjectMember`
- `Task`
- `ServiceRequest`
- `Document`
- `ActivityLog`

Includes enums for role/status/priority types, foreign keys, timestamps, and practical indexes.

## Folder Structure

```txt
app/
components/
lib/
prisma/
tests/
uploads/
Dockerfile
docker-compose.yml
```

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `UPLOAD_DIR`
- `MAX_UPLOAD_MB`

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start PostgreSQL (Docker)

```bash
docker compose up -d db
```

Default host mapping in this project uses `localhost:5433` to avoid local `5432` conflicts.

### 3) Generate Prisma client

```bash
npm run db:generate
```

### 4) Sync schema to database

```bash
npx prisma db push
```

### 5) Seed demo data

```bash
npm run db:seed
```

### 6) Run app

```bash
npm run dev
```

Open: `http://localhost:3100`

## Docker App Run

To run app + database fully in Docker:

```bash
docker compose up --build
```

App: `http://localhost:3100`

## VPS Deployment

For a Hetzner-style VPS setup, use a reverse proxy plus the production compose file in this repo.

### 1) Prepare a shared Docker network for Caddy

```bash
docker network create caddy
```

### 2) Copy the app to the server

Example target directory:

```bash
/srv/apps/clientops
```

### 3) Create production env file

Use [`.env.production.example`](/Users/simon/Code/ClientOps/.env.production.example) as the template:

```bash
cp .env.production.example .env.production
```

Set:

- `APP_DOMAIN`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### 4) Start the production stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5) Initialize the database

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

### 6) Optional deploy helper

There is a small deploy script at [`scripts/deploy.sh`](/Users/simon/Code/ClientOps/scripts/deploy.sh):

```bash
bash scripts/deploy.sh /srv/apps/clientops
```

## Validation / Quality Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Demo Credentials

All demo users use password: `Password123!`

- Admin: `admin@clientops.dev`
- Team Member 1: `team1@clientops.dev`
- Team Member 2: `team2@clientops.dev`
- Client 1: `client1@clientops.dev`
- Client 2: `client2@clientops.dev`

## Key Features Implemented

- Credentials authentication + protected routes
- Role-based authorization in UI and server logic
- KPI dashboard + activity + deadlines
- Clients: list/search/create/edit/archive/detail
- Projects: list/filter/create/edit/archive/detail
- Tasks: create/update/delete + filtering
- Service requests: submit + workflow status updates
- Documents: upload + metadata persistence + secure download + visibility rules
- Activity log write hooks for core mutations
- Seeded realistic demo dataset
- Responsive SaaS-style shell with reusable components

## Known Limitations

- Prisma migrations (`prisma migrate dev`) are not used in this setup due current environment/engine constraints; schema sync uses `prisma db push`.
- Middleware warning exists in Next.js 16 about migration to `proxy` convention (non-blocking).
- No dedicated admin user-management screen yet (optional item).

## V2 Improvement Ideas

- Full migration pipeline with pinned Node LTS toolchain and CI migration checks
- Richer form UX using full React Hook Form bindings + inline validation messages everywhere
- Audit filtering/export, notifications, and realtime updates
- S3-compatible object storage for documents
- Advanced reporting and profitability metrics per client/project
- Fine-grained permission matrix and admin user management UI
