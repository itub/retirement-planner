# NestEgg — Retirement Planner

A full-stack retirement planning web app with Monte Carlo simulations, social security modeling, and automatic asset allocation glide paths.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | Google OAuth2 via Passport.js |
| Hosting | Vercel (frontend) + Render (backend + DB) |

## Features

- **Google OAuth2 authentication** — secure, no passwords
- **Account management** — 401k, Traditional IRA, Roth IRA, Brokerage, Savings, Pension
- **Retirement plan inputs** — age, income, retirement age, spouse, real estate, social security
- **Actuarial life expectancy** — based on SSA 2021 period life tables
- **Monte Carlo simulation** — 1,000 runs with randomized returns, produces a confidence score
- **3-scenario projections** — good, average, and poor market outcomes
- **Social security modeling** — draw at any eligible age (62–70), automatic benefit adjustment
- **Auto asset allocation glide path** — 60/40 stocks/bonds pre-retirement → 20/80 at age 75

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (local or a free [Render](https://render.com) / [Supabase](https://supabase.com) instance)
- A Google Cloud project with OAuth2 credentials

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd retirement-planner
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Set up Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
7. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=3001
SESSION_SECRET=generate-a-long-random-string-here
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
DATABASE_URL=postgresql://postgres:password@localhost:5432/retirement_planner
CLIENT_URL=http://localhost:5173
```

### 4. Set up the Database

```bash
# Create the database
createdb retirement_planner

# Run migrations
cd server && npm run db:migrate
```

### 5. Start Development Servers

```bash
# From the root directory — starts both client and server
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** to `client`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`

### Backend → Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add environment variables (all from `server/.env.example`):
   - `DATABASE_URL` — from your Render Postgres instance
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL` — `https://your-render-url.onrender.com/auth/google/callback`
   - `CLIENT_URL` — your Vercel frontend URL
   - `SESSION_SECRET` — a long random string
   - `NODE_ENV=production`

### Database → Render Postgres

1. Render → New → PostgreSQL
2. Copy the **Internal Database URL** into your backend's `DATABASE_URL` env var
3. Run migrations via Render's shell: `npm run db:migrate`

### Update Google OAuth for Production

In Google Cloud Console, add your production callback URL:
`https://your-render-url.onrender.com/auth/google/callback`

---

## Project Structure

```
retirement-planner/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Layout, shared UI
│   │   ├── pages/           # Dashboard, Accounts, Plan, Simulation
│   │   ├── store/           # Zustand auth store
│   │   ├── lib/             # Axios API client
│   │   └── styles/          # Global CSS
│   └── vite.config.js
├── server/                  # Express backend
│   └── src/
│       ├── db/              # Postgres pool, schema, migrations
│       ├── middleware/       # Auth guard
│       ├── routes/          # auth, accounts, plan, simulation
│       └── services/
│           └── simulation.js  # Monte Carlo engine
├── package.json             # Monorepo root
└── README.md
```

## Simulation Methodology

### Market Assumptions (real / inflation-adjusted)

| Scenario | Stocks | Bonds | Stock Std Dev |
|----------|--------|-------|---------------|
| Good     | 10%    | 4%    | 14%           |
| Average  | 7%     | 3%    | 17%           |
| Poor     | 2%     | 1%    | 20%           |

### Asset Allocation Glide Path

| Phase | Stocks | Bonds |
|-------|--------|-------|
| Pre-retirement | 60% | 40% |
| Retirement → Age 75 | linear interpolation | |
| Age 75+ | 20% | 80% |

### Monte Carlo

- 1,000 simulations run server-side
- Each year's return is drawn from a normal distribution (Box-Muller transform)
- Confidence score = % of simulations where portfolio never hits $0

### Life Expectancy

Uses SSA 2021 period life table approximations with conditional survival (if you've reached your current age, you're likely to live longer than the population average).

---

## Roadmap / Future Features

- [ ] Tax-efficient withdrawal ordering (Roth last)
- [ ] Required Minimum Distributions (RMDs)
- [ ] Inflation rate customization
- [ ] Income growth rate assumption
- [ ] Downloadable PDF report
- [ ] Dark mode
- [ ] Mobile-responsive layout
- [ ] Scenario comparison (what if I retire 2 years earlier?)
