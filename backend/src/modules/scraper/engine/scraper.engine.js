'use strict';

/**
 * ScraperEngine — Universal Multi-Layer Data Extraction Engine
 *
 * Architecture:
 *   Layer 1: Fetch    - auto-detects strategy per domain
 *   Layer 2: Parse    - routes by file type (HTML/PDF/DOCX/Image)
 *   Layer 3: Extract  - DOM --> Regex --> LLM --> Vision (stops when complete)
 *   Layer 4: Validate - dedup, clean, normalise
 *   Layer 5: Heal     - saves discovered selectors to DB
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const path    = require('path');
const logger  = require('../../../shared/config/logger');

// --- Constants -----------------------------------------------------------------
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

const PERIOD_MAP = {
  'one-time': [
    'one time', 'one-time', 'non-refundable', 'onetime', 'once',
    'admission fee', 'registration fee', 'enrolment fee', 'enrollment fee',
    'one off', 'single payment', 'initial fee', 'joining fee',
  ],
  'per credit': [
    'per credit', '/credit', 'credit hour', 'per ch',
    'per unit', 'per module', 'credit basis', 'each credit',
    'per credit hour', 'per ch basis',
  ],
  'per semester': [
    'per semester', '/semester', 'semester fee', 'per term',
    'per session', 'each semester', 'per trimester', 'trimester fee',
    'per quarter', 'quarterly', 'each term', 'term fee',
  ],
  'per year': [
    'per year', '/year', 'annual', 'yearly',
    'per annum', 'p.a.', 'each year', 'annual fee',
    'per academic year', 'academic year fee',
  ],
  'per month': [
    'per month', '/month', 'monthly',
    'each month', 'per calendar month',
  ],
};

const GARBAGE_PATTERNS = [
  /^note[:\s]/i, /^mode of payment/i, /^account/i, /^bank/i,
  /^swift/i, /bkash/i, /rocket/i, /nagod/i, /visa card/i,
  /^for local/i, /^for foreign/i, /^contact/i, /alumni/i,
  /copyright/i, /©/, /all rights reserved/i, /\d{4}\s+all rights/i,
  /^privacy/i, /^terms/i, /^sitemap/i, /^powered by/i,
  /admissions\s*©/i, /©\s*\d{4}/i,
];

const DEFAULT_SELECTORS = {
// --- Tuition / Fees synonyms -----------------------------------------------------------------
  tuition: [
    '[class*="fee"]',       '[id*="fee"]',
    '[class*="tuition"]',   '[id*="tuition"]',
    '[class*="cost"]',      '[id*="cost"]',
    '[class*="charge"]',    '[id*="charge"]',
    '[class*="payment"]',   '[id*="payment"]',
    '[class*="rate"]',      '[id*="rate"]',
    '[class*="price"]',     '[id*="price"]',
    '.table-bordered', '.table-striped', 'table.table',
    'table:contains("Program")',    'table:contains("Credit")',
    'table:contains("Fee")',        'table:contains("Tuition")',
    'table:contains("Cost")',       'table:contains("Charge")',
    'table:contains("Amount")',     'table:contains("Rate")',
    'table:contains("Payment")',    'table:contains("Semester")',
    'table:contains("BDT")',        'table:contains("Taka")',
    'table:contains("Tk")',
    'section table', 'article table', 'table',
  ],

// --- Admission synonyms -----------------------------------------------------------------
  admission: [
    // Class/ID based
    '[class*="admission"]',     '[id*="admission"]',
    '[class*="apply"]',         '[id*="apply"]',
    '[class*="application"]',   '[id*="application"]',
    '[class*="enroll"]',        '[id*="enroll"]',
    '[class*="enrolment"]',     '[id*="enrolment"]',
    '[class*="registration"]',  '[id*="registration"]',
    '[class*="how-to-apply"]',
    '#admission', '#apply', '#application', '#enroll',
    'div:contains("Last Date")',        'div:contains("Deadline")',
    'div:contains("Closing Date")',     'div:contains("Due Date")',
    'div:contains("Submission Date")',  'div:contains("Application Period")',
    'div:contains("Apply By")',         'div:contains("Open Until")',
    'div:contains("Applications Open")',
    'p:contains("Deadline")',           'p:contains("last date")',
    'p:contains("closing date")',       'p:contains("apply by")',
    'p:contains("open until")',         'p:contains("due date")',
    '.notice', '[class*="notice"]',
    'section:contains("admission")',    'section:contains("apply")',
    'section:contains("application")',  'section:contains("enrollment")',
    'section:contains("how to apply")', 'section:contains("join us")',
    'section:contains("entry")',        'section:contains("registration")',
    'section:contains("academic calendar")',
  ],

// --- Scholarship synonyms -----------------------------------------------------------------
  scholarship: [
    '[class*="scholarship"]', '[id*="scholarship"]',
    '[class*="financial"]',   '[id*="financial"]',
    '[class*="waiver"]',      '[id*="waiver"]',
    '[class*="grant"]',       '[id*="grant"]',
    '[class*="bursary"]',     '[id*="bursary"]',
    '[class*="aid"]',         '[id*="aid"]',
    '[class*="funding"]',     '[id*="funding"]',
    '[class*="concession"]',  '[id*="concession"]',
    '[class*="remission"]',   '[id*="remission"]',
    '[class*="freeship"]',    '[id*="freeship"]',
    '[class*="stipend"]',     '[id*="stipend"]',
    '[class*="fellowship"]',  '[id*="fellowship"]',
    '#scholarship', '#financial-aid', '#aid', '#grant',
    'h2:contains("Scholarship")',   'h3:contains("Scholarship")',   'h4:contains("Scholarship")',
    'h2:contains("Financial Aid")', 'h3:contains("Financial Aid")',
    'h2:contains("Financial")',     'h3:contains("Financial")',
    'h2:contains("Waiver")',        'h3:contains("Waiver")',
    'h2:contains("Grant")',         'h3:contains("Grant")',
    'h2:contains("Bursary")',       'h3:contains("Bursary")',
    'h2:contains("Funding")',       'h3:contains("Funding")',
    'h2:contains("Fee Waiver")',    'h3:contains("Fee Waiver")',
    'h2:contains("Free")',          'h3:contains("Freeship")',
    'h2:contains("Concession")',    'h3:contains("Remission")',
    'h2:contains("Assistantship")', 'h3:contains("Fellowship")',
    'section:contains("Scholarship")',    'section:contains("Financial Aid")',
    'section:contains("Waiver")',         'section:contains("Grant")',
    'section:contains("Bursary")',        'section:contains("Concession")',
    'section:contains("Free Studentship")',
    'div:contains("Waiver")',         'div:contains("Financial Aid")',
    'div:contains("Merit")',          'div:contains("Concession")',
    'div:contains("Free Studentship")', 'div:contains("Bursary")',
    'table:contains("Scholarship")',  'table:contains("Waiver")',
    'table:contains("Grant")',        'table:contains("Concession")',
    'ul:contains("scholarship")',     'li:contains("scholarship")',
    'li:contains("waiver")',          'li:contains("grant")',
  ],

// --- Eligibility synonyms -----------------------------------------------------------------
  eligibility: [
    '[class*="eligib"]',       '[id*="eligib"]',
    '[class*="requirement"]',  '[id*="requirement"]',
    '[class*="criteria"]',     '[id*="criteria"]',
    '[class*="qualification"]','[id*="qualification"]',
    '[class*="who-can"]',      '[class*="entry-req"]',
    '#eligibility', '#requirements', '#criteria', '#qualification',
    'h2:contains("Eligibility")',   'h3:contains("Eligibility")',
    'h2:contains("Requirements")',  'h3:contains("Requirements")',
    'h2:contains("Qualification")', 'h3:contains("Qualification")',
    'h2:contains("Who Can Apply")', 'h3:contains("Who Can Apply")',
    'h2:contains("Entry Criteria")', 'h3:contains("Entry Criteria")',
    'h2:contains("Admission Criteria")', 'h3:contains("Admission Criteria")',
    'td:contains("GPA")',  'td:contains("CGPA")',
    'li:contains("GPA")',  'li:contains("CGPA")',
    'p:contains("GPA")',   'p:contains("CGPA")',
    'div:contains("Minimum GPA")', 'div:contains("Minimum CGPA")',
    'div:contains("minimum GPA")', 'div:contains("minimum CGPA")',
  ],
};

const RX = {
  // Currency prefixes - BDT, Taka, USD, etc.
  amountPrefix: /(?:BDT|Tk\.?|Taka|৳|USD|\$|EUR|GBP)\s*([\d,]+(?:\.\d{1,2})?)/gi,
  amountRaw:    /\b([\d]{1,3}(?:,[\d]{3})+(?:\.\d{1,2})?)\b/g,

// --- Deadline synonyms -----------------------------------------------------------------
  deadline: [
    /(?:last\s+date|deadline|apply\s+by|closing\s+date|due\s+date|submission\s+date|registration\s+deadline|application\s+deadline)[^\d]*(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/gi,
    /(?:last\s+date|deadline|closing\s+date|due\s+date)[^\d]*(\w+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:applications?\s+open\s+(?:till|until)|open\s+until|open\s+for\s+admission\s+(?:till|until)|accepting\s+applications?\s+(?:till|until))\s+([^\n.]{5,40})/gi,
    /applications?\s+open[^\n]{0,30}?to\s+(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/gi,
    /(?:deadline|last\s+date|closing)[^\d]*(\d{4}[\-\/]\d{2}[\-\/]\d{2})/gi,
  ],

// --- Intake / semester synonyms -----------------------------------------------------------------
  intake: /(?:spring|fall|summer|autumn|winter|january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:intake\s+)?\d{4}|(?:1st|2nd|3rd|first|second|third)\s+(?:semester|intake|batch)\s+\d{4}/gi,

// --- GPA / result synonyms -----------------------------------------------------------------
  gpa: [
    /(?:minimum|min\.?|at\s+least|not\s+less\s+than)\s+(?:GPA|CGPA)\s*(?:of\s+)?[:\-–]?\s*(\d+(?:\.\d+)?)/gi,
    /(?:GPA|CGPA)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:or\s+above|or\s+higher|minimum|and\s+above|\+|out\s+of)/gi,
    /(?:GPA|CGPA)\s+(?:not\s+less\s+than|of\s+at\s+least)\s+(\d+(?:\.\d+)?)/gi,
    /(\d+(?:\.\d+)?)\s+(?:GPA|CGPA)\b/gi,
    /(?:GPA|CGPA)\s*[:\-–]\s*(\d+(?:\.\d+)?)/gi,
    /(?:SSC|HSC|O\s+Level|A\s+Level)[^\n]{0,40}?(?:GPA|CGPA)\s*[:\-–]?\s*(\d\.\d+)/gi,
    /minimum\s+(?:result|score|grade)\s+(?:of\s+)?(\d+(?:\.\d+)?)/gi,
    /(?:achieve|maintain|obtain|attain|secure)\s+(?:a\s+)?(?:GPA|CGPA)\s+(?:of\s+)?(\d+(?:\.\d+)?)/gi,
  ],

// --- Language / English proficiency synonyms -----------------------------------------------------------------
  language: /(?:IELTS(?:\s+score)?(?:\s+of|\s*[:\-])\s*\d[^\n.]{0,80}|TOEFL(?:\s+score)?(?:\s+of|\s*[:\-])\s*\d[^\n.]{0,80}|TOEIC(?:\s+score)?[^\n.]{0,80}|Duolingo(?:\s+score)?[^\n.]{0,80}|SAT(?:\s+score)?(?:\s+of|\s*[:\-])\s*\d[^\n.]{0,80}|GRE(?:\s+score)?(?:\s+of|\s*[:\-])\s*\d[^\n.]{0,80}|GMAT(?:\s+score)?(?:\s+of|\s*[:\-])\s*\d[^\n.]{0,80}|English\s+(?:proficiency|language\s+proficiency|proficiency\s+test|medium\s+of\s+instruction|as\s+medium|requirement)[^\n.]{0,120}|medium\s+of\s+instruction\s+(?:is\s+)?(?:english|English)[^\n.]{0,80}|English\s+proficiency\s+certificate[^\n.]{0,80})/gi,
};

class ScraperEngine {

}

module.exports = new ScraperEngine();