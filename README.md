# NextPropConnect SA

South Africa's modern property platform - connecting buyers, sellers, renters and agents.

## 🌐 Live Site
- **URL:** https://nextpropconnect.co.za
- **Test Dashboard:** https://nextpropconnect.co.za/tests

## 🚀 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL via Prisma
- **Auth:** NextAuth.js
- **Payments:** Ozow
- **Hosting:** Docker on Hetzner VPS
- **Proxy:** Caddy

## ✅ Completed Phases
| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation | ✅ |
| 1 | Core Listings | ✅ |
| 2 | Communication & WhatsApp | ✅ |
| 3 | Agent CRM | ✅ |
| 4 | Monetization (Ozow) | ✅ |
| 5 | Reviews & Trust | ✅ |
| 6 | AI Features | ⬜ |
| 7 | Rental Management | ✅ |
| 8 | Verification & Trust | ✅ |
| - | Multi-Tenant Properties | ✅ |
| - | Roommates/Flatshare | ✅ |
| - | Agency/Enterprise | ✅ |

## 📁 Project Structure
```
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── lib/          # Utilities (Prisma, auth, etc.)
│   └── styles/       # Tailwind CSS
├── prisma/           # Database schema
└── tests/            # E2E test suite (102 tests)
```

## 🏃 Running Locally
```bash
npm install
npx prisma generate
npm run dev
```

## 🐳 Docker Deployment
```bash
docker compose up -d
```

## 🔑 Environment Variables
See `.env.example` for required configuration.

---
*Developed by iTedia (Pty) Ltd*
