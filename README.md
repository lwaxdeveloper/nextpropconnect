# NextPropConnect SA

South Africa's modern property platform - connecting buyers, sellers, renters and agents.

## 🌐 Live Site
- **URL:** https://nextpropconnect.co.za
- **Test Dashboard:** https://nextpropconnect.co.za/tests

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Agent | agent@test.nextpropconnect.co.za | Test123! |
| Buyer | buyer@test.nextpropconnect.co.za | Test123! |
| Renter | renter@test.nextpropconnect.co.za | Test123! |
| Landlord | landlord@test.nextpropconnect.co.za | Test123! |
| Admin | admin@test.nextpropconnect.co.za | Test123! |

**Payments:** Ozow test mode enabled (use test cards)

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
| 7 | Rental Management | ✅ |
| 8 | Verification & Trust | ✅ |
| - | Multi-Tenant Properties | ✅ |
| - | Roommates/Flatshare | ✅ |
| - | Agency/Enterprise | ✅ |

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

---
*Developed by iTedia (Pty) Ltd*
