-- CreateEnum
CREATE TYPE "UniversityType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'SKIPPED');

-- CreateTable
CREATE TABLE "universities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "scrapeUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "type" "UniversityType" NOT NULL DEFAULT 'PRIVATE',
    "logoUrl" TEXT,
    "description" TEXT,
    "scrapeable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_info" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "applicationDeadline" TEXT,
    "requirementsText" TEXT,
    "intakeMonths" TEXT,
    "applyUrl" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tuition_fees" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "program" TEXT NOT NULL,
    "amountLocal" DOUBLE PRECISION,
    "amountUSD" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "period" TEXT NOT NULL DEFAULT 'per semester',
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tuition_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_criteria" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "minGPA" TEXT,
    "languageReqs" TEXT,
    "otherRequirements" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eligibility_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" TEXT,
    "eligibility" TEXT,
    "deadline" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_jobs" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "status" "ScrapeStatus" NOT NULL DEFAULT 'PENDING',
    "strategy" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "accuracyScore" DOUBLE PRECISION,
    "fieldsFound" INTEGER NOT NULL DEFAULT 0,
    "fieldsTotal" INTEGER NOT NULL DEFAULT 4,
    "retryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "retryOfJobId" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrape_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_scrape_configs" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_scrape_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_website_key" ON "universities"("website");

-- CreateIndex
CREATE UNIQUE INDEX "admission_info_universityId_key" ON "admission_info"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_criteria_universityId_key" ON "eligibility_criteria"("universityId");

-- CreateIndex
CREATE INDEX "scrape_jobs_universityId_idx" ON "scrape_jobs"("universityId");

-- CreateIndex
CREATE INDEX "scrape_jobs_status_idx" ON "scrape_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "university_scrape_configs_universityId_key" ON "university_scrape_configs"("universityId");

-- AddForeignKey
ALTER TABLE "admission_info" ADD CONSTRAINT "admission_info_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuition_fees" ADD CONSTRAINT "tuition_fees_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_scrape_configs" ADD CONSTRAINT "university_scrape_configs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
