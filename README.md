# Roosterly – Full Stack Monorepo (Express + TanStack Start)

A full-stack monorepo with **Backend (Node.js + Express + MongoDB)** and **Frontend (TanStack Start + TanStack Router + Vite + React 19 + shadcn/ui)** built with **TypeScript**, configured to run locally with a single command and deploy to **Vercel** as a unified project.

---

## 📁 Monorepo Structure

```text
roosterly/
├── .gitignore               # Single unified root .gitignore
├── package.json             # Root monorepo workspace configuration
├── vercel.json              # Unified Vercel deployment configuration
├── api/
│   └── index.ts             # Vercel Serverless Function entry point for backend
├── apps/
│   ├── backend/             # Express.js + Mongoose + TypeScript
│   │   ├── src/
│   │   │   ├── app.ts       # Express app and route definitions (exported)
│   │   │   ├── index.ts     # Standalone local server listener (app.listen)
│   │   │   └── db/          # Database connection with serverless connection reuse
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/            # TanStack Start + Router + React 19 + Tailwind CSS
│       ├── src/
│       ├── vite.config.ts   # Configured with Nitro and dev proxy
│       ├── package.json
│       └── tsconfig.json
└── README.md
```

---

## 🧱 Tech Stack

- **Backend (`apps/backend`):** Node.js, Express 5, TypeScript, MongoDB, Mongoose, CORS, Dotenv.
- **Frontend (`apps/frontend`):** React 19, TanStack Start (SSR), TanStack Router, Nitro, Tailwind CSS v4, shadcn/ui, Vite.
- **Serverless API (`api/index.ts`):** Vercel Serverless Function executing the backend Express app.

---

## 🚀 Getting Started

### 1️⃣ Install Dependencies
From the repository root, install dependencies for all workspaces at once:
```bash
npm install
```

### 2️⃣ Run Both Apps Concurrently
To start both backend and frontend development servers at once:
```bash
npm run dev
```

- **Backend:** `http://localhost:5000` (live reloads via `tsx watch`)
- **Frontend:** `http://localhost:3000` (live reloads via `vite`)

### 3️⃣ Additional Workspace Scripts
- `npm run dev:backend` — Run only the backend server
- `npm run dev:frontend` — Run only the frontend app
- `npm run build` — Build both backend and frontend for production
- `npm run build:backend` — Build backend TypeScript (`tsc`)
- `npm run build:frontend` — Build frontend with Nitro & TanStack Start

---

## ☁️ Deploying to Vercel (All-at-Once)

This monorepo is pre-configured with [`vercel.json`](file:///D:/projects/roosterly/vercel.json) and [`api/index.ts`](file:///D:/projects/roosterly/api/index.ts) so that linking your GitHub repository to Vercel deploys the entire stack at once in a **single Vercel project**:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), select **Import Project** and choose this repository.
3. Keep the **Root Directory** as `./` (default). Vercel will automatically detect `vercel.json` and `framework: tanstack-start`.
4. In **Project Settings > Environment Variables**, add your secrets:
   - `MONGO_URI` — Your MongoDB connection string.
5. Click **Deploy**.

### How Vercel Routes Traffic:
- **`https://your-domain.vercel.app/`** — Serves the TanStack Start frontend app.
- **`https://your-domain.vercel.app/api/*`** — Routed directly to the backend Express serverless function via `api/index.ts`.
- **No CORS issues in production:** Since frontend and backend share the same origin on Vercel, requests to `/api` work without cross-origin friction.
