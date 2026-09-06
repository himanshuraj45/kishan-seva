# 🌐 KisanSeva Frontend (Next.js)

This is the primary web application and Progressive Web App (PWA) for **KisanSeva**, built with Next.js (App Router).

## 🚀 Tech Stack
- **Framework:** Next.js 16 (App Router + Turbopack)
- **Styling:** Tailwind CSS v4, Framer Motion
- **State Management:** Zustand, TanStack Query
- **Authentication:** Clerk
- **Database Client:** Supabase JS
- **Maps:** Leaflet, React-Leaflet
- **Icons:** Lucide React

## 📦 Key Directories
- src/app/: Next.js App Router pages and layouts.
- src/app/api/: Serverless API routes (Groq AI, TTS, Geo-proxy, Fallback AI orchestration).
- src/components/: Reusable UI components.
- src/store/: Zustand state management.
- src/lib/: Utilities, Supabase client, and AI configurations.

## 🛠️ Local Development

1. Ensure you have Node.js 18+ and 
pm installed.
2. Install dependencies (from the monorepo root):
   `ash
   cd ../../
   npm install
   `
3. Setup environment variables:
   Copy .env.example to .env.local inside pps/web/ and fill in your keys:
   `ash
   cd apps/web
   cp .env.example .env.local
   `
4. Run the development server:
   `ash
   npm run dev
   `
   Or for HTTPS (required to test microphone/camera locally):
   `ash
   npx next dev --experimental-https
   `
5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🌍 Environment Variables Needed

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk Auth public key |
| CLERK_SECRET_KEY | Clerk Auth secret key |
| NEXT_PUBLIC_SUPABASE_URL | Supabase Database URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase public Anon key |
| GROQ_API_KEY | Groq API key (for Chat, Whisper, etc.) |
| GEMINI_API_KEY | Google AI Studio Key (Primary for Vision/OCR) |
| NVIDIA_NIM_KEY | Nvidia NIM Key (Vision Fallback) |
| NEXT_PUBLIC_ML_URL | URL to the deployed ML-Service (e.g. Render) |

## 🚀 Deployment
This app is optimized for zero-config deployment on **Vercel**.
Live Demo: [https://kisanseva-ks.vercel.app](https://kisanseva-ks.vercel.app)
