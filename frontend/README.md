# Civic Engagement Web Dashboard

Planner and admin dashboard built with React, Vite, and Tailwind CSS.

## Features

- Policy management and publishing
- Analytics, trends, heatmaps, and export
- Comment moderation and AI health
- Planner and admin user workflows
- Real-time notifications via Socket.IO

## Prerequisites

- Node.js 20+
- npm
- Backend running at `http://localhost:5000`

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

## Environment

The frontend uses `VITE_API_BASE_URL` to connect to the backend.

- Default development URL: `http://localhost:5000/api`
- In production, the app will use `/api` if `VITE_API_BASE_URL` is not set.

Example `.env` value:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

## Run

```bash
npm run dev
```

Then open the app at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Notes

- If the backend is hosted on a different address, update `VITE_API_BASE_URL`.
- The frontend expects the backend REST API to be reachable at `/api`.
