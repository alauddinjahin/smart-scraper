# Smart Scraper - Backend

Production Node.js API for university data management and intelligent web scraping operations.

## Overview

A modular monolith providing RESTful endpoints for university CRUD, job management, and web scraping orchestration. Built with Express, Prisma ORM, and PostgreSQL with comprehensive error handling, validation, and job scheduling.

## Features

- RESTful API with standardized response formatting
- University data management with full CRUD operations
- Web scraping with multiple strategies (detection, fetch, LLM-based)
- Asynchronous job tracking with status polling
- Session-based authentication
- Input validation with Joi
- Comprehensive error handling
- Request logging and debugging
- Database migrations with Prisma

## Tech Stack

- **Runtime**: Node.js 20.18.0
- **Framework**: Express 4.18.2
- **Database**: PostgreSQL v17 with Prisma 5.7.1 ORM
- **Validation**: Joi 17.11.0
- **HTTP Client**: Axios 1.6.2
- **HTML Parsing**: Cheerio 1.0.0
- **Testing**: Jest with coverage
- **Logging**: Js Default Error Class but In future, Winston will be added or grafana, kibana for a server.
- **Environment**: dotenv

## Architecture

### Layered Module Pattern

Each feature (university, job, scraper) follows a three-layer architecture:

```
Controller (HTTP handling)
    ↓
Service (Business logic)
    ↓
Repository (Data persistence)
```

**Controller** handles request validation, parameter extraction, and response formatting. **Service** contains core business logic, workflow orchestration, and cross-cutting concerns. **Repository** abstracts database operations with Prisma.

### Directory Structure

```
src/
├── app.js                    # Express app setup
├── server.js                 # Server entry point
│
├── infrastructure/
│   └── database/
│       └── prisma.client.js # Prisma singleton
│
├── modules/
│   ├── university/          # University management
│   │   ├── controller/      # HTTP handlers
│   │   ├── service/         # Business logic
│   │   ├── repository/      # Database queries
│   │   ├── schema/          # Joi validation schemas
│   │   ├── dto/             # Request/response DTOs
│   │   └── routes/          # Route definitions
│   │
│   ├── job/                 # Job tracking
│   │   ├── controller/
│   │   ├── service/         # Job lifecycle & polling
│   │   ├── repository/
│   │   ├── schema/
│   │   └── routes/
│   │
│   └── scraper/             # Web scraping
│       ├── controller/
│       ├── service/         # Strategy orchestration
│       ├── engine/          # Scraper implementations
│       ├── strategies/      # Base, detection, fetch, LLM
│       ├── utils/           # Parsing helpers
│       ├── routes/
│       └── tests/
│
├── shared/
│   ├── middleware/          # Express middleware
│   ├── errors/              # Error classes
│   ├── config/              # Configuration
│   ├── validators/          # Shared validation
│   ├── utils/               # Utilities
│   └── types/               # TypeScript types
│
└── tests/
    ├── integration/         # API tests
    ├── unit/               # Unit tests
    └── setup.js            # Test configuration
```

### Design Patterns

**Repository Pattern**: Data access abstraction via repository classes for testability and consistency.

**Strategy Pattern**: Multiple scraping approaches (detect language from page, fetch via Cheerio, LLM-based extraction) plugged into a single interface. Strategies are selected based on university requirements.

**Service Locator**: Centralized database, logger, and validator instances in shared config for easy access throughout application.

**Middleware Chain**: Request → Logger → Validation → Auth → Handler → Error Formatter → Response.

## Setup

### Prerequisites

- Node.js 20.18.0
- PostgreSQL 17
- npm

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Create `.env`:
```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smart_scraper

# Logging
LOG_LEVEL=debug

# Session
SESSION_SECRET=dev-secret-change-in-production
SESSION_EXPIRY_HOURS=8

# LLM API (optional)
OPENAI_API_KEY=sk-...
```

### Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Seed with demo data
npm run seed
```

### Start Development Server

```bash
npm run dev
```

API runs on `http://localhost:4000`

## Development Command

```bash
npm run dev         # Start with hot reload
npm start          # Production start
npm run build      # Build (if applicable)
npm run seed       # Seed database with demo universities
npm test           # Run Jest tests
npm test -- --coverage  # With coverage report
npm run lint       # ESLint check
```

## Error Handling

All endpoints follow standardized error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "name": "University name is required"
    }
  }
}
```

**Error Codes**:
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource doesn't exist
- `UNAUTHORIZED`: Session required
- `FORBIDDEN`: Insufficient permissions
- `CONFLICT`: Resource already exists
- `INTERNAL_SERVER_ERROR`: Unexpected server error

Error handling middleware logs all errors with request context for debugging.

## Validation

All inputs validated with Joi schemas before processing:

```bash
# Valid POST /api/universities
{
  "name": "string (required, 2-255 chars)",
  "website": "string (required, valid URL)",
  "country": "string (required, 2-100 chars)"
}

# Invalid - missing name
Response 400:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "University name is required"
    }
  }
}
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Specific test file
npm test university.service.test.js

# Coverage
npm test -- --coverage
```

### Integration Tests

Run against development database after migrations:

```bash
npm test -- tests/integration/
```

## API Endpoints

### Universities

**GET /api/universities**
Fetch all universities with pagination.

```bash
curl "http://localhost:4000/api/universities?page=1&limit=10"

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "MIT",
      "website": "https://mit.edu",
      "country": "USA",
      "createdAt": "2025-03-23T21:08:37Z",
      "updatedAt": "2025-03-23T21:08:37Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

**POST /api/universities**
Create a new university.

```bash
curl -X POST http://localhost:4000/api/universities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stanford University",
    "website": "https://stanford.edu",
    "country": "USA"
  }'

Response:
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "Stanford University",
    "website": "https://stanford.edu",
    "country": "USA",
    "createdAt": "2025-03-24T10:30:00Z",
    "updatedAt": "2025-03-24T10:30:00Z"
  }
}
```

**GET /api/universities/:id**
Fetch specific university.

```bash
curl http://localhost:4000/api/universities/uuid

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "MIT",
    "website": "https://mit.edu",
    "country": "USA",
    "createdAt": "2025-03-23T21:08:37Z",
    "updatedAt": "2025-03-23T21:08:37Z"
  }
}
```

**PUT /api/universities/:id**
Update university.

```bash
curl -X PUT http://localhost:4000/api/universities/uuid \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MIT (Updated)",
    "country": "USA"
  }'

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "MIT (Updated)",
    "website": "https://mit.edu",
    "country": "USA",
    "createdAt": "2025-03-23T21:08:37Z",
    "updatedAt": "2025-03-24T10:35:00Z"
  }
}
```

**DELETE /api/universities/:id**
Delete university.

```bash
curl -X DELETE http://localhost:4000/api/universities/uuid

Response:
{
  "success": true,
  "data": null
}
```

### Scraping Jobs

**POST /api/scraper/scrape**
Initiate scraping job for university.

```bash
curl -X POST http://localhost:4000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "uuid"
  }'

Response:
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "universityId": "uuid",
    "status": "pending",
    "strategy": "auto-detect",
    "progress": 0,
    "createdAt": "2025-03-24T10:40:00Z"
  }
}
```

**GET /api/jobs/:jobId**
Get job status and results.

```bash
curl http://localhost:4000/api/jobs/job-uuid

Response:
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "universityId": "uuid",
    "status": "completed",
    "strategy": "cheerio-fetch",
    "progress": 100,
    "result": {
      "admissionRate": "3.2%",
      "fees": "USD 60,000",
      "eligibility": {
        "minGPA": "3.8",
        "requirementsUrl": "https://mit.edu/admissions"
      }
    },
    "createdAt": "2025-03-24T10:40:00Z",
    "completedAt": "2025-03-24T10:45:32Z"
  }
}
```

**GET /api/jobs**
List all jobs with filtering.

```bash
curl "http://localhost:4000/api/jobs?status=completed&limit=20"

Response:
{
  "success": true,
  "data": [
    {
      "jobId": "job-uuid",
      "universityId": "uuid",
      "status": "completed",
      "strategy": "cheerio-fetch",
      "progress": 100,
      "createdAt": "2025-03-24T10:40:00Z",
      "completedAt": "2025-03-24T10:45:32Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245
  }
}
```

## Web Scraping Strategies

The scraper service automatically selects strategy based on website structure:

1. **Language Detection**: Analyze page markup for admission-related keywords
2. **Cheerio Fetch**: Parse HTML with regex/CSS selectors for structured data
3. **LLM Extraction**: Use OpenAI to intelligently extract data from unstructured pages

Each strategy returns consistent data format: `{ admissionRate, fees, eligibility }`.

## Database

Uses Prisma ORM connecting to PostgreSQL. Migrations tracked in `prisma/migrations/`. Schema enforces data integrity with foreign keys and constraints.

Prisma Client singleton in `infrastructure/database/prisma.client.js` prevents connection leaks.

## Logging

Winston logger configured in `shared/config/logger.js`:
- **Development**: Colorized console output
- **Production**: JSON structured logs
- Logs include request ID for tracing

Access logs for all HTTP requests. Error logs capture stack traces and request context.

### Self-Hosted

```bash
npm run build
npm start
# Run with PM2: pm2 start src/server.js --name smart-scraper-backend
```

## Contributing

- Follow existing code structure and patterns
- Write tests for new features
- Run linter: `npm run lint`
- Validate with TypeScript: `npx tsc --noEmit`

**Last Updated**: March 24, 2026
