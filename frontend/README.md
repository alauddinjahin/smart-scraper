# Smart Scraper - Frontend

Modern Next.js applications for managing university data and monitoring web scraping operations.

## Overview

A production-grade React frontend with Server Components, real-time job monitoring, and a comprehensive design system. Built with Next.js 14, TypeScript, and SWR for efficient data synchronization.

## Features

- Dashboard with statistics
- University CRUD operations with pagination
- Live job monitoring with status polling  
- Comprehensive university detail pages
- Session-based mock authentication with middleware protection
- Form validation with real-time feedback
- Error recovery with ErrorBoundary components
- Responsive design across all devices

## Architecture

The app uses Next.js App Router with a clear separation between server and client concerns:

- **Server Components (RSC)**: Initial data fetching, metadata generation, no client bundle cost
- **Client Components**: Interactive features, form handling, real-time updates via SWR
- **API Layer**: Type-safe client for backend communication with automatic request deduplication
- **Custom Hooks**: Encapsulate data fetching logic (useAuth, useUniversities, useJob)
- **Middleware**: Session validation at route level, redirects to login for protected pages

## Tech Stack

- **Next.js**: 14.2.0 (App Router, SSR/SSG, API routes)
- **React**: 18.3.0
- **TypeScript**: 5.4.5
- **Tailwind CSS**: 3.4.3 (utilities + design tokens)
- **SWR**: 2.2.5 (data fetching with caching)
- **Lucide Icons**: 0.378.0

## Setup

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:4000`

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Run

```bash
npm run dev   # Development with hot reload
npm run build # Production build
npm start     # Production server
```

Visit `http://localhost:3000`

## Development

### Available Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
```

### Project Structure

```
src/
├── app/               # Route definitions
│   ├── (app)/        # Protected routes
│   ├── (auth)/       # Public routes (login)
│   └── api/          # Backend API routes
├── components/
│   ├── ui/           # Reusable components
│   ├── layout/       # Sidebar, Providers
│   ├── dashboard/    # Dashboard widgets
│   └── university/   # Domain-specific components
├── lib/
│   ├── api/          # Backend client
│   ├── auth/         # Session helpers
│   └── hooks/        # Custom React hooks
├── middleware.ts     # Route protection
├── styles/           # Design tokens
└── types/           # API types
```

## Authentication

Middleware validates session cookie on every request. Unauthenticated users are redirected to `/login`. Session token is an HTTP-only cookie set after successful login, expiring after 8 hours.

Demo credentials (development only):
- admin@uniscraper.dev / admin123
- ala@uniscraper.dev / password123  
- viewer@uniscraper.dev / viewer123

## Data Fetching Strategy

**Server Components** fetch data on first load via `getUniversities()` with automatic request memoization. **Client Components** use **SWR hooks** for mutations and real-time updates with 60-second deduplication intervals.

Global error handler in Providers deduplicates notifications over 10 seconds and silently handles expected 404s.

## Design System

Consistent UI through CSS custom properties (`--bg-surface`, `--text-primary`, `--brand`, etc.) defined in `globals.css`. Tailwind provides layout utilities; color variables enable theme switching without recompile.

Semantic colors for status: `--success`, `--warning`, `--danger`, `--info`.  
Spacing on 4px base unit: `--space-1` through `--space-16`.

## Error Handling

ErrorBoundary wraps page sections with fallback UI. Client errors throw and propagate to nearest boundary. Async errors in handlers use try/catch with toast notifications. Network failures trigger retry logic in SWR config; 4xx errors skip retries.

## Performance

- Server Components eliminate client-side rendering overhead
- Request deduplication in RSCs and SWR
- CSS variables instead of Tailwind @apply (smaller bundle)
- Dynamic imports for heavy components
- GSAP animations loaded client-only (commented in demo)

## Debugging

Use browser DevTools (F12) to inspect network requests and set TypeScript breakpoints. Console Ninja extension shows runtime logs in editor. SWR has built-in DevTools for cache inspection.

## Styling

All colors and spacing use CSS variables. Modification in `globals.css` applies globally without rebuild.

## Deployment

**Vercel (Recommended)**
```bash
vercel
vercel env add NEXT_PUBLIC_API_URL
```

**Self-Hosted**
```bash
npm run build
npm start
# Or with PM2: pm2 start "npm start" --name smart-scraper-frontend
```

## Future Work

- Real authentication (OAuth2, Clerk)  
- Dark mode toggle
- Advanced filtering and export (CSV/PDF)
- Analytics dashboard
- Offline support via Service Workers
