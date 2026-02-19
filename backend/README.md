# Backend

Express server on port 4000 with CORS enabled.

## Scripts
- `npm run dev` — start with nodemon for live reload.
- `npm start` — start the compiled server.

## Endpoints
- `GET /health` → `{ "status": "ok" }`
- `GET /` → `Backend running`

## Env
Copy `.env.example` to `.env` and fill Supabase values when ready.

### Resend setup (for application email notifications)
1. In Resend, verify your sending domain first (DNS records).
2. Set `RESEND_API_KEY` in `backend/.env`.
3. Set `RESEND_FROM_EMAIL` as an address under your verified domain.
4. Set `ADMIN_NOTIFY_EMAIL` to recipient mailbox(es). You can use comma-separated values.
5. Optional: set `RESEND_REPLY_TO_EMAIL` if you want replies to go to a specific inbox.

When a user submits `POST /api/applications`, backend sends an admin notification mail via Resend.
