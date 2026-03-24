# Smart Scraper

> Intelligent web scraper for university data extraction and aggregation

A full-stack application designed to automatically scrape and aggregate university admission requirements, tuition fees, eligibility criteria, and scholarship information from institutional websites. Features a powerful scraping engine with multiple strategies and a comprehensive management dashboard.

---

## 📋 Overview

**Smart Scraper** automates the collection of critical university data through intelligent web scraping. The platform provides an intuitive interface to manage universities, trigger scraping operations, monitor job progress, and visualize extracted data with accuracy metrics.

### Key Features

- **Multi-Strategy Web Scraping**: Intelligent extraction using fetch, detection, and LLM-based strategies
- **University Management**: Full CRUD operations for university records with custom scrape URLs
- **Job Monitoring**: Real-time tracking of scraping jobs with status polling and error recovery
- **Data Extraction**: Automatic collection of:
  - Admission requirements and deadlines
  - Tuition and fee structures
  - Student eligibility criteria
  - Scholarship opportunities
- **Accuracy Metrics**: Scrape accuracy scoring and field detection reporting
- **Job History**: Complete audit trail of all scraping operations
- **Dashboard Analytics**: Statistics and recent activity overview

---

## Architecture

This is a full-stack TypeScript application with a robust scraping engine and intuitive user interface.

### Backend Stack
- **Framework**: Node.js with Express.js
- **Language**: JavaScript
- **Database**: PostgreSQL with Prisma ORM
- **Scraper Engine**: Custom web scraping engine with multiple strategies
- **Job Queue**: Background job processing and polling
- **Features**: RESTful APIs, web scraping, data extraction

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript + React 18
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: SWR for data fetching and real-time polling
- **UI Components**: Custom component library with accessibility features

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/smart-scraper.git
cd smart-scraper
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:4000`

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
smart-scraper/
├── backend/
│   ├── src/
│   │   ├── app.js                         # Express app configuration
│   │   ├── server.js                      # Server entry point
│   │   ├── modules/
│   │   │   ├── scraper/                   # Web scraping engine
│   │   │   │   ├── engine/                # Core scraper logic
│   │   │   │   ├── strategies/            # Multiple extraction strategies
│   │   │   │   │   ├── base.js            # Base strategy
│   │   │   │   │   ├── detection.js       # DOM detection strategy
│   │   │   │   │   ├── fetch.js           # HTTP fetch strategy
│   │   │   │   │   └── llm.client.js      # LLM-powered extraction
│   │   │   │   ├── service/               # Scraper business logic
│   │   │   │   └── controller/            # Scraper API handlers
│   │   │   ├── university/                # University CRUD operations
│   │   │   └── job/                       # Job tracking and polling
│   │   ├── infrastructure/                # Database & external services
│   │   ├── shared/                        # Shared utilities & middleware
│   │   └── tests/                         # Integration & unit tests
│   └── prisma/
│       ├── schema.prisma                  # Database schema
│       └── migrations/                    # Database migrations
│
├── frontend/
│   ├── src/
│   │   ├── app/                           # Next.js app directory
│   │   │   ├── (app)/                     # Protected routes (authenticated)
│   │   │   │   ├── page.tsx               # Dashboard with stats
│   │   │   │   ├── universities/          # University management
│   │   │   │   └── jobs/                  # Scraping jobs page
│   │   │   └── (auth)/login/              # Authentication
│   │   ├── components/
│   │   │   ├── ui/                        # Reusable UI components
│   │   │   ├── layout/                    # Layout shells
│   │   │   ├── dashboard/                 # Dashboard widgets
│   │   │   └── university/                # University-specific components
│   │   │       ├── UniversityTable.tsx    # University list & management
│   │   │       ├── UniversityModal.tsx    # Add/edit university form
│   │   │       ├── ScrapeButton.tsx       # Start scraping UI
│   │   │       └── detail/                # University detail page
│   │   ├── lib/
│   │   │   ├── api/                       # Server-side API client
│   │   │   ├── auth/                      # Authentication logic
│   │   │   └── hooks/                     # Custom React hooks
│   │   │       ├── useUniversities.ts     # University operations
│   │   │       ├── useJob.ts              # Job polling & monitoring
│   │   │       └── useAuth.ts             # User session
│   │   ├── styles/                        # Global styles & design tokens
│   │   ├── types/                         # TypeScript definitions
│   │   └── middleware.ts                  # Next.js edge middleware
│   ├── cypress/                           # E2E tests
│   └── jest.config.ts                     # Unit test configuration
```

---

## 🤖 Scraping Strategies

The application implements multiple scraping strategies to handle different website structures:

### 1. **DOM Detection Strategy**
Automatically detects and extracts data from common HTML patterns and selectors.

### 2. **HTTP Fetch Strategy**
Direct HTTP requests with custom headers and parsing for structured data extraction.

### 3. **LLM-Powered Strategy**
Uses AI/LLM for intelligent field detection and extraction from unstructured content.

### Base Strategy
Common interface for all strategies with error handling and logging.

---

## 🔐 Authentication

The application uses session-based authentication with HTTP-only cookies.

### Demo Credentials

| Role   | Email                    | Password      |
|--------|--------------------------|---------------|
| Admin  | admin@uniscraper.dev    | admin123      |
| Admin  | ala@uniscraper.dev      | password123   |
| Viewer | viewer@uniscraper.dev   | viewer123     |

**Note**: Demo credentials are for development only. Replace with a production authentication provider in production.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### Frontend Tests
```bash
cd frontend

# Unit tests
npm test

# Unit tests in watch mode
npm test:watch

# E2E tests (requires running frontend)
npm run cy:open   # Interactive mode
npm run cy:run    # Headless mode
```

---

## 📊 Database Schema

The Prisma schema defines the core data models:

- **University**: Institution records with scrape URLs and metadata
- **ScrapeJob**: Scraping task tracking with status and accuracy metrics
- **AdmissionInfo**: Admission deadlines, requirements, and application URLs
- **TuitionFee**: Tuition structures by program and period
- **EligibilityCriteria**: Student eligibility and GPA requirements
- **Scholarship**: Available scholarships and eligibility info
- **UniversityScrapeConfig**: Custom scraping configuration per university

See `backend/prisma/schema.prisma` for the complete schema.

---

## 🔧 Configuration

### Backend Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smart_scraper

# Server
NODE_ENV=development
PORT=4000

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 📡 API Endpoints

### Universities
- `GET /api/universities` - List universities with pagination
- `GET /api/universities/:id` - Get university details
- `POST /api/universities` - Create university
- `PATCH /api/universities/:id` - Update university
- `DELETE /api/universities/:id` - Delete university

### Scraping
- `POST /api/universities/:id/scrape` - Start scrape job
- `POST /api/scrape/all` - Batch scrape all universities

### Jobs
- `GET /api/jobs/:jobId` - Get job status
- `GET /api/jobs` - List all jobs

---

## 🚢 Deployment

### Backend Deployment
1. Set environment variables in your hosting platform
2. Run database migrations: `npx prisma migrate deploy`
3. Build and deploy: `npm run build && npm start`

### Frontend Deployment
- Deploy to Vercel: `vercel deploy`
- Or build and deploy to any Node-compatible platform: `npm run build && npm start`

---

## 📦 Dependencies

### Backend Key Packages
- **express**: Web framework
- **prisma**: ORM for database operations
- **node-fetch** / **axios**: HTTP client for web scraping
- **joi**: Input validation

### Frontend Key Packages
- **next**: React framework with SSR
- **react**: UI library
- **swr**: Data fetching, caching, and real-time polling
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date utilities

---

## 🎯 Workflow

1. **Add University**: Create a university record with website URL and custom scrape URLs
2. **Configure Scraping**: (Optional) Set custom scraping configuration per institution
3. **Trigger Scrape**: Initiate a scraping job for a university
4. **Monitor Progress**: Watch job status in real-time via polling
5. **Review Results**: Check extracted data and accuracy metrics
6. **Track History**: View all previous scraping operations

---

## 🐛 Known Issues & Limitations

- **Dynamic Sites**: Websites with heavy JavaScript rendering require Puppeteer integration
- **Rate Limiting**: No built-in rate limiting; implement for aggressive scraping
- **Authentication**: Currently uses mock authentication; implement OAuth2 for production
- **Strategy Selection**: Manual strategy selection; could be automated with ML
- **Captcha Handling**: Manual intervention required for Captcha-protected sites

---

## 🔮 Future Roadmap

- [ ] Browser automation (Puppeteer/Selenium) for JavaScript-heavy sites
- [ ] Automatic strategy selection based on website analysis
- [ ] Scheduled/recurring scraping jobs
- [ ] Advanced analytics and trend detection
- [ ] Data quality validation and duplicate detection
- [ ] Export functionality (CSV, JSON, PDF)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Captcha solving integration
- [ ] Proxy rotation for large-scale scraping
- [ ] Machine learning for field detection improvement

---

**Last Updated**: March 24, 2026
