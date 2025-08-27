# Dasho Server

Express + MongoDB + JWT backend for authentication.

## Endpoints

- POST /api/auth/register
  - Body: { name, email, password } (email must end with @academy.bt)
  - Response: { ok, message }

- POST /api/auth/login
  - Body: { email, password }
  - Response: { ok, token, user: { id, name, email, role }, redirect }

- GET /api/protected/equipment
  - Header: Authorization: Bearer <token>

- GET /api/protected/admin-dashboard
  - Header: Authorization: Bearer <token>
  - Requires role = admin

## Setup

1. Copy .env.example to .env and edit values.
2. Install deps.
3. Start server.
