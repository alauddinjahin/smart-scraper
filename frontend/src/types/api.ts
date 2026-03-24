export type UniversityType = 'PUBLIC' | 'PRIVATE';

export type ScrapeStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'SKIPPED';


export interface UniversityListItem {
  id:                number;
  name:              string;
  website:           string;
  location:          string | null;
  type:              UniversityType;
  logoUrl:           string | null;
  scrapeable:        boolean;
  tuitionCount:      number;
  scholarshipCount:  number;
  admissionDeadline: string | null;
  lastScrapedAt:     string | null;
  createdAt:         string;
  updatedAt:         string;
}

export interface AdmissionInfo {
  id:                  number;
  applicationDeadline: string | null;
  requirementsText:    string | null;
  intakeMonths:        string | null;
  applyUrl:            string | null;
  scrapedAt:           string | null;
}

export interface TuitionFee {
  id:          number;
  program:     string;
  amountLocal: number | null;
  amountUSD:   number | null;
  currency:    string;
  period:      string;
  scrapedAt:   string | null;
}

export interface EligibilityCriteria {
  id:                number;
  minGPA:            string | null;
  languageReqs:      string | null;
  otherRequirements: string | null;
  scrapedAt:         string | null;
}

export interface Scholarship {
  id:          number;
  name:        string;
  amount:      string | null;
  eligibility: string | null;
  deadline:    string | null;
  scrapedAt:   string | null;
}

export interface ScrapeJobSummary {
  id:            number;
  status:        ScrapeStatus;
  strategy:      string | null;
  accuracyScore: number | null;
  fieldsFound:   number;
  startedAt:     string | null;
  completedAt:   string | null;
}

export interface UniversityDetail {
  id:           number;
  name:         string;
  website:      string;
  scrapeUrls:   string[];
  location:     string | null;
  type:         UniversityType;
  logoUrl:      string | null;
  description:  string | null;
  scrapeable:   boolean;
  createdAt:    string;
  updatedAt:    string;
  admission:    AdmissionInfo | null;
  tuitionFees:  TuitionFee[];
  eligibility:  EligibilityCriteria | null;
  scholarships: Scholarship[];
  scrapeJobs:   ScrapeJobSummary[];
}


export interface ScrapeJob {
  id:            number;
  universityId:  number;
  status:        ScrapeStatus;
  strategy:      string | null;
  attemptCount:  number;
  maxAttempts:   number;
  accuracyScore: number | null;
  fieldsFound:   number;
  fieldsTotal:   number;
  retryEnabled:  boolean;
  retryOfJobId:  number | null;
  startedAt:     string | null;
  completedAt:   string | null;
  errorLog:      string | null;
  createdAt:     string;
  university?: {
    id:      number;
    name:    string;
    website: string;
  };
}

export interface TriggerResponse {
  jobId:          number;
  universityId:   number;
  universityName: string;
  pollUrl:        string;
  message:        string;
}


export interface ByType {
  type:   UniversityType;
  _count: { _all: number };
}

export interface DashboardStats {
  total:       number;
  byType:      ByType[];
  avgAccuracy: number | null;
  recentJobs:  ScrapeJob[];
}


export interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data:    T[];
  meta: {
    total: number;
    page:  number;
    limit: number;
    pages: number;
  };
}

export interface UniversityQuery {
  page?:   number;
  limit?:  number;
  search?: string;
  type?:   UniversityType;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  order?:  'asc' | 'desc';
}

export interface CreateUniversityInput {
  name:        string;
  website:     string;
  location?:   string;
  type?:       UniversityType;
  description?: string;
  scrapeable?:  boolean;
  scrapeUrls?:  string[];
}

export type UpdateUniversityInput = Partial<CreateUniversityInput>;
