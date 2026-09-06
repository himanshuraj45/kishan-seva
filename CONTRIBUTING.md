# Contributing to KisanSeva

Thank you for contributing to **KisanSeva** — India's AI-powered farming platform!

## 🌿 Getting Started

`ash
# Clone the repository
git clone https://github.com/abhranilsingharoy-cloud/kisan_seva.git
cd kisan_seva

# Install dependencies (uses pnpm + Turborepo)
pnpm install

# Start the dev server
pnpm dev
`

The web app will run at **http://localhost:5173**.

## 🏗️ Project Structure

`
kisan_seva/
├── apps/
│   └── web/                   # Next.js 16 web application
│       ├── src/app/           # App Router pages & API routes
│       ├── src/components/    # Shared UI components
│       └── src/lib/           # Utilities, Supabase client
├── packages/                  # Shared packages (future)
├── scripts/                   # Developer tooling & data scripts
└── .github/workflows/         # CI/CD pipelines
`

## 📋 Branch Strategy

| Branch | Purpose |
|--------|---------|
| main | Production — deploys to Vercel automatically |
| develop | Integration branch for new features |
| eat/<name> | Feature branches — branch from develop |
| ix/<name> | Bug-fix branches |

`ash
# Create a feature branch
git checkout -b feat/my-feature develop
`

## 📝 Commit Convention

We follow **Conventional Commits**:

`
feat(scope): add new feature
fix(scope): fix a bug
docs(scope): update documentation
refactor(scope): code change without feature/fix
chore: maintenance (deps, config)
`

Examples:
- eat(market): add real-time mandi price filter
- ix(auth): resolve Clerk token expiry on mobile
- docs: update README architecture diagram

## 🧪 Code Quality

Before submitting a PR, ensure:

`ash
# Type check
pnpm --filter web exec tsc --noEmit

# Lint
pnpm --filter web lint
`

All CI checks must pass for a PR to be merged.

## 🔐 Environment Variables

Copy .env.example to .env.local and fill in the required values:

| Variable | Source |
|---------|--------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project settings |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase project settings |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk dashboard |
| CLERK_SECRET_KEY | Clerk dashboard |
| GROQ_API_KEY | Groq console |
| NEXT_PUBLIC_MAPBOX_TOKEN | Mapbox account |

## 🌐 API Conventions

All backend routes live under pps/web/src/app/api/:

- Use NextResponse.json() for all responses
- Always return { success: boolean, data: any } shape
- Validate inputs with **Zod** (already installed)
- Handle errors gracefully with try/catch

## 🤝 Pull Request Process

1. Fork the repo and create your feature branch
2. Write clean, documented code with JSDoc for exported functions
3. Ensure all CI checks pass
4. Fill out the PR template completely
5. Request a review from @abhranilsingharoy-cloud

**Thank you for making KisanSeva better for India's farmers! 🌾**
