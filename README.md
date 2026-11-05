# AdTech Platform - Advertiser Dashboard

Advertiser dashboard (React + Vite + Tailwind) with a Node.js + Express backend. It contains only what the
architecture document lists for the advertiser dashboard (section 4.2), the advertiser analytics (section 8),
the campaign lifecycle and configuration (sections 5.1 and 5.2) and invoices (section 9).

## Run it

You need Node.js 18.11 or newer.

```bash
npm install                 # installs "concurrently" at the root
npm run install:all         # installs backend and frontend packages
npm run dev                 # API on :5000, app on :5173
```

Dashboard: http://localhost:5173. Sample login: `rekha@example.com` / `password123`, or create your own account.
One-server build: `npm run build` then `npm start` (Express serves the API and the built app on :5000).

## Doc section -> screen

| Doc (4.2 Advertiser Dashboard) | Where |
| --- | --- |
| Registration and company profile | Create account (company name required) and **Company Profile** |
| Advertiser verification | **Verification** (business name, PAN, GSTIN, document) |
| Campaign creation, duration, operating hours, geographic targeting, number of autos, frequency, budget | **Create Campaign** |
| Image and video uploads | Create Campaign (JPG, PNG, WEBP up to 5 MB; MP4, WEBM, MOV up to 50 MB) |
| Estimated campaign reach | Create Campaign, labelled as an estimate |
| Campaign approval tracking | Dashboard counts and the step tracker inside every campaign on **My Campaigns** |
| Live campaign performance | Dashboard chart and **Playback Reports** |
| Playback reports | **Playback Reports** (per campaign and by location) |
| Invoice and payment history | **Invoices & Payments** |

Advertiser analytics (section 8) on the dashboard: total targeted devices, active devices, playback starts,
completed, interrupted, completion rate, geographic distribution, campaign running hours, campaign expenditure.

## Measurement principle (section 8)

The reports keep three things apart: **verified playback** (device events validated by the platform),
**estimated reach** (scheduled playbacks calculated from the advertiser's own settings) and **independently
verified exposure** (not available; playback does not prove a person saw the ad).

## Campaign lifecycle

Submit -> Pending Approval -> admin (outside this app) approves (Scheduled or Active) or rejects (with a reason) -> Completed.
No payment is taken when a campaign is submitted. When an admin approves it, an invoice is issued.

This project is the advertiser dashboard only. Approval, verification and invoice decisions are made in the Super Admin
dashboard (a separate app in the doc), so here they are shown as read-only status. The sample data includes a campaign in
each state (Pending Approval, Scheduled, Active, Completed, Rejected) so every screen can be seen.

## API (all routes except `/api/auth/*` need `Authorization: Bearer <token>`)

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register`, `/login`, `/logout` | Account |
| GET | `/api/dashboard` | Totals, approval counts, geographic distribution, latest campaigns |
| GET | `/api/analytics/performance?range=this_month\|last_month\|last_7_days` | Daily playback starts / completed / interrupted |
| GET | `/api/analytics/report` | Playback report per campaign, totals, geographic distribution |
| GET / POST | `/api/campaigns` | List (optional `?status=`) / submit a campaign for approval |
| GET | `/api/campaigns/estimate?...` | Estimated scheduled playbacks |
| GET | `/api/campaigns/:id` | Details with approval steps |
| GET | `/api/locations`, `/api/locations/:id/availability?startDate=&endDate=` | Locations and free autos |
| POST / DELETE | `/api/uploads?filename=`, `/api/uploads/:file` | Creative upload |
| POST | `/api/uploads/kyc?filename=` | Verification document (stored privately, never served) |
| GET / PUT | `/api/verification`, `/api/profile` | Verification and company profile |
| GET | `/api/invoices` | Invoice and payment history |

## Things to know

- All numbers are sample data in `backend/data/store.js` (autos per location, campaigns, playback, invoices). Sample
  campaigns are dated relative to today. Data is held in memory and resets when the server restarts.
- Playback figures come from the sample records. The daily chart is added up from them, nothing is scaled or invented
  on top. Replace the store with Supabase PostgreSQL and the playback service from the doc when you build them.
- Availability counts autos reserved by Pending Approval, Approved, Scheduled, Active and Paused campaigns whose dates
  overlap. Autos at each location are shared by all advertisers.
- Estimated reach = autos x days x operating hours x plays per hour. No audience figure is assumed.
- No prices are set by this app. The advertiser enters a budget; the invoice amount equals that budget.
- Sessions are kept in server memory and passwords are hashed (scrypt). Use Supabase Auth and RLS before going live.
- Removed because they are not in the doc: clicks and CTR, card/UPI/net banking payment forms, Support, notifications,
  search, Settings, and Pause/Delete on campaigns.
