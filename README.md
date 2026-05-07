# BetFinder Backend

Express + MongoDB backend for the Angular frontend API contract.

## Features

- JWT auth with roles (`buyer`, `agent`, `admin`)
- Properties module with filtering, pagination, favorites, and moderation
- Bookings module for buyer/agent workflows
- Admin stats endpoint
- Cloudinary image upload integration

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env` and fill values
3. Run development server:
   - `npm run dev`
4. Seed initial admin (optional):
   - `npm run seed`

Server base URL: `http://localhost:5000/api`

## Environment Variables

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL` (for seed)
- `ADMIN_PASSWORD` (for seed)
- `APIFY_TOKEN` (Apify API token)
- `APIFY_ACTOR_ID` (default Actor to run)
- `APIFY_IMPORT_AGENT_EMAIL` (email of User that will own imported properties; defaults to `ADMIN_EMAIL`)
- `APIFY_WEBHOOK_SECRET` (optional; validate `X-Webhook-Secret` on `/api/apify/webhook`)

## API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `PUT /auth/profile`

### Properties

- `GET /properties`
- `GET /properties/:id`
- `GET /properties/featured`
- `GET /properties/cities`
- `POST /properties`
- `PUT /properties/:id`
- `DELETE /properties/:id`
- `GET /properties/my`
- `POST /properties/:id/favorite`
- `GET /properties/favorites`
- `PATCH /properties/:id/approve`

### Bookings

- `POST /bookings`
- `GET /bookings/my`
- `GET /bookings/agent`
- `PATCH /bookings/:id/status`

### Admin

- `GET /admin/stats`

### Apify (scrape + import)

- `POST /apify/runs` (admin) start Actor run
- `POST /apify/runs/:runId/import` (admin) import dataset of a run
- `POST /apify/webhook` (public) Apify webhook callback → imports the run dataset
