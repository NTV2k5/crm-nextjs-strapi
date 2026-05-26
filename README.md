# CRM Next.js + Strapi

Full-stack CRM system.

## Stack
- Frontend: Next.js 14 + TypeScript + Shadcn UI
- Backend: Strapi v5 + SQLite/PostgreSQL
- Auth: HttpOnly Cookie BFF Proxy


## Production Deployment

### Frontend (Vercel)
vercel --prod

### Backend (Render Cloud)
Docker: render.yaml configured
PostgreSQL add-on enabled
Auto-deploy on main branch push

## Architecture
[Browser] -> [Vercel - Next.js 14] -> [Render - Strapi v5] -> [PostgreSQL]
