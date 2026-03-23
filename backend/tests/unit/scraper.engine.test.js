'use strict';

// Mock axios so axios.create() returns a real-ish object with a mockable .get
const mockHttpGet = jest.fn();
jest.mock('axios', () => ({
  create: jest.fn(() => ({ get: mockHttpGet })),
}));
jest.mock('../../src/infrastructure/database/prisma.client', () => ({
  universityScrapeConfig: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert:     jest.fn().mockResolvedValue({}),
  },
}));

const axios  = require('axios');
const engine = require('../../src/modules/scraper/engine/scraper.engine');
const { USER_AGENTS } = require('../../src/modules/scraper/utils/constants');

const httpClient = axios.create({
  timeout: 30000,
  responseType: 'arraybuffer',
  headers: {
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  },
});
const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const StrategyDetectionEngine = require('../../src/modules/scraper/strategies/detection');
const StrategyDetection = new StrategyDetectionEngine({httpClient, randomUA});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const HTML_WITH_FEES = `
<html><body>
  <section class="admission">
    <p>Last date to apply: 30 November 2025</p>
    <a href="https://apply.uni.edu">Apply Now</a>
  </section>
  <table class="table-bordered">
    <tr><th>Program</th><th>Fee</th></tr>
    <tr><td>BSc Engineering</td><td>BDT 45,000</td></tr>
    <tr><td>MBA</td><td>BDT 60,000</td></tr>
    <tr><td>Admission Fee</td><td>Tk. 25,000 (one time)</td></tr>
  </table>
  <section class="eligibility">
    <p>Minimum GPA: 4.5. IELTS score of 6.0 required.</p>
  </section>
  <section class="scholarship">
    <h3>Merit Scholarship</h3>
    <p>50% tuition waiver for top students who maintain GPA above 3.8</p>
  </section>
</body></html>
`;

// Full result — all _missing() sub-fields populated so _missing() returns []
const FULL_RESULT = {
  admission:    { applicationDeadline: '30 Nov 2025', intakeMonths: 'Spring', applyUrl: 'https://apply.uni.edu', requirementsText: 'Apply online by deadline' },
  tuitionFees:  [{ program: 'BSc Engineering', amountLocal: 45000, currency: 'BDT', period: 'per semester' }],
  eligibility:  { minGPA: '4.5', languageReqs: 'IELTS score of 6.0', otherRequirements: 'SSC and HSC required' },
  scholarships: [{ name: 'Merit Scholarship', amount: '50%', eligibility: '50% tuition waiver for top students who maintain GPA', deadline: null }],
};

// ─────────────────────────────────────────────────────────────────────────────

describe('ScraperEngine', () => {

  beforeEach(() => jest.clearAllMocks());

  // ── _fileType ──────────────────────────────────────────────────────────────
  describe('_fileType()', () => {
    it('detects pdf',              () => expect(engine._fileType('https://x.com/doc.pdf')).toBe('pdf'));
    it('detects jpg image',        () => expect(engine._fileType('https://x.com/img.jpg')).toBe('image'));
    it('detects png image',        () => expect(engine._fileType('https://x.com/img.png')).toBe('image'));
    it('detects docx',             () => expect(engine._fileType('https://x.com/file.docx')).toBe('docx'));
    it('defaults to html',         () => expect(engine._fileType('https://x.com/page')).toBe('html'));
    it('strips query string',      () => expect(engine._fileType('https://x.com/doc.pdf?v=2')).toBe('pdf'));
    it('strips hash fragment',     () => expect(engine._fileType('https://x.com/page#section')).toBe('html'));
    it('handles uppercase ext',    () => expect(engine._fileType('https://x.com/DOC.PDF')).toBe('pdf'));
  });

  // ── _detectPeriod ──────────────────────────────────────────────────────────
  describe('_detectPeriod()', () => {
    it('detects one-time from "non-refundable"',   () =>
      expect(engine._detectPeriod('Admission Fee', 'Tk 25,000 non-refundable', '')).toBe('one-time'));
    it('detects one-time from "registration fee"', () =>
      expect(engine._detectPeriod('Registration', '5000 registration fee', '')).toBe('one-time'));
    it('detects per credit',                       () =>
      expect(engine._detectPeriod('Tuition', '8,000 per credit', '')).toBe('per credit'));
    it('detects per credit from "credit hour"',    () =>
      expect(engine._detectPeriod('Course Fee', '3,500 per credit hour', '')).toBe('per credit'));
    it('detects per semester',                     () =>
      expect(engine._detectPeriod('Semester Fee', '12,000 per semester', '')).toBe('per semester'));
    it('detects per year from "annual"',           () =>
      expect(engine._detectPeriod('Annual Fee', '50,000 annual', '')).toBe('per year'));
    it('detects per year from "per annum"',        () =>
      expect(engine._detectPeriod('Program Fee', '45,000 per annum', '')).toBe('per year'));
    it('defaults to per semester for unknown',     () =>
      expect(engine._detectPeriod('Something', '5000', '')).toBe('per semester'));
  });

  // ── _validProgram ──────────────────────────────────────────────────────────
  describe('_validProgram()', () => {
    it('accepts valid program name',        () => expect(engine._validProgram('BSc Engineering')).toBe(true));
    it('accepts short name',               () => expect(engine._validProgram('MBA')).toBe(true));
    it('rejects empty string',             () => expect(engine._validProgram('')).toBe(false));
    it('rejects null',                     () => expect(engine._validProgram(null)).toBe(false));
    it('rejects undefined',                () => expect(engine._validProgram(undefined)).toBe(false));
    it('rejects over 100 chars',           () => expect(engine._validProgram('x'.repeat(101))).toBe(false));
    it('rejects "Mode of payment" text',   () => expect(engine._validProgram('Mode of payment: Bkash')).toBe(false));
    it('rejects bkash mention',            () => expect(engine._validProgram('Pay via Bkash')).toBe(false));
    it('rejects text with Tk amount',      () => expect(engine._validProgram('Admission Tk. 5000')).toBe(false));
    it('rejects copyright text',           () => expect(engine._validProgram('Copyright NSU 2024')).toBe(false));
    it('rejects "contact" prefix',         () => expect(engine._validProgram('Contact us for fees')).toBe(false));
  });

  // ── _validAmount ──────────────────────────────────────────────────────────
  describe('_validAmount()', () => {
    it('accepts 5,000 BDT',         () => expect(engine._validAmount(5000)).toBe(true));
    it('accepts 500 (minimum)',      () => expect(engine._validAmount(500)).toBe(true));
    it('accepts 1,000,000',          () => expect(engine._validAmount(1_000_000)).toBe(true));
    it('accepts 10,000,000 (max)',   () => expect(engine._validAmount(10_000_000)).toBe(true));
    it('rejects 0',                  () => expect(engine._validAmount(0)).toBe(false));
    it('rejects 499 (below min)',    () => expect(engine._validAmount(499)).toBe(false));
    it('rejects negative',           () => expect(engine._validAmount(-100)).toBe(false));
    it('rejects over 10M',           () => expect(engine._validAmount(10_000_001)).toBe(false));
    it('rejects NaN',                () => expect(engine._validAmount(NaN)).toBe(false));
    it('rejects string "5000"',      () => expect(engine._validAmount('5000')).toBe(false));
    it('rejects null',               () => expect(engine._validAmount(null)).toBe(false));
  });

  // ── _isNavContent ─────────────────────────────────────────────────────────
  describe('_isNavContent()', () => {
    it('rejects JavaScript code',    () =>
      expect(engine._isNavContent('$(function() { var x = .slick(); })')).toBe(true));
    it('rejects jQuery slick code',  () =>
      expect(engine._isNavContent('dept_slideshow.slick({ arrows: true })')).toBe(true));
    it('rejects nav menu dump',      () =>
      expect(engine._isNavContent('Apply Now Undergraduate Admission Postgraduate Admission FAQs Brochure')).toBe(true));
    it('rejects copyright text',     () =>
      expect(engine._isNavContent('Copyright © 2024 NSU Admissions')).toBe(true));
    it('accepts real scholarship text', () =>
      expect(engine._isNavContent('Merit scholarship of BDT 50,000 for top students')).toBe(false));
    it('accepts real eligibility text', () =>
      expect(engine._isNavContent('Minimum GPA 4.5 on SSC and HSC required')).toBe(false));
    it('returns false for null',     () =>
      expect(engine._isNavContent(null)).toBe(false));
    it('returns false for empty',    () =>
      expect(engine._isNavContent('')).toBe(false));
  });

  // ── _classifyEligibilityText ──────────────────────────────────────────────
  describe('_classifyEligibilityText()', () => {
    it('routes scholarship criteria → scholarship', () =>
      expect(engine._classifyEligibilityText(
        'must maintain CGPA 3.5 to retain scholarship'
      )).toBe('scholarship'));
    it('routes waiver criteria → scholarship', () =>
      expect(engine._classifyEligibilityText(
        '50% tuition waiver for students with financial need'
      )).toBe('scholarship'));
    it('routes admission requirements → admission', () =>
      expect(engine._classifyEligibilityText(
        'applicants must have minimum SSC GPA 4.0 to be admitted'
      )).toBe('admission'));
    it('routes pure GPA criteria → eligibility', () =>
      expect(engine._classifyEligibilityText(
        'minimum CGPA 3.0, IELTS 6.5 required'
      )).toBe('eligibility'));
    it('scholarship wins over admission on ambiguous text', () =>
      expect(engine._classifyEligibilityText(
        'scholarship eligibility for admitted students with GPA above 3.8'
      )).toBe('scholarship'));
  });

  // ── _empty ────────────────────────────────────────────────────────────────
  describe('_empty()', () => {
    it('returns correct shape', () => {
      const e = engine._empty();
      expect(e).toHaveProperty('admission');
      expect(e).toHaveProperty('tuitionFees');
      expect(e).toHaveProperty('eligibility');
      expect(e).toHaveProperty('scholarships');
      expect(e.tuitionFees).toEqual([]);
      expect(e.scholarships).toEqual([]);
      expect(e.admission.applicationDeadline).toBeNull();
      expect(e.eligibility.minGPA).toBeNull();
    });
  });

  // ── _domExtract ───────────────────────────────────────────────────────────
  describe('_domExtract()', () => {

    it('extracts tuition fees from table', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      expect(result.tuitionFees.length).toBeGreaterThan(0);
      const bsc = result.tuitionFees.find(f => f.program.includes('BSc'));
      expect(bsc).toBeDefined();
      expect(bsc.amountLocal).toBe(45000);
      expect(bsc.currency).toBe('BDT');
    });

    it('extracts MBA fee', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      const mba = result.tuitionFees.find(f => f.program === 'MBA');
      expect(mba).toBeDefined();
      expect(mba.amountLocal).toBe(60000);
    });

    it('detects one-time period for admission fee', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      const admFee = result.tuitionFees.find(f => f.program.includes('Admission'));
      expect(admFee?.period).toBe('one-time');
    });

    it('extracts admission deadline from "last date" text', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      expect(result.admission.applicationDeadline).toBeTruthy();
      expect(result.admission.applicationDeadline).toMatch(/November|Nov/i);
    });

    it('extracts applyUrl from anchor tag', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      expect(result.admission.applyUrl).toBeTruthy();
    });

    it('extracts eligibility GPA', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      expect(result.eligibility.minGPA).toBe('4.5');
    });

    it('extracts IELTS language requirement', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      expect(result.eligibility.languageReqs).toMatch(/IELTS/i);
    });

    it('extracts scholarship name containing "Merit"', () => {
      const result = engine._domExtract(HTML_WITH_FEES, null);
      expect(result.scholarships.length).toBeGreaterThan(0);
      expect(result.scholarships[0].name).toMatch(/Merit/i);
    });

    it('deduplicates fee rows with same program+amount', () => {
      const dupHTML = `<html><body>
        <table class="table">
          <tr><td>BSc CSE</td><td>BDT 45,000</td></tr>
          <tr><td>BSc CSE</td><td>BDT 45,000</td></tr>
        </table></body></html>`;
      const result = engine._domExtract(dupHTML, null);
      const cseFees = result.tuitionFees.filter(f => f.program.includes('BSc CSE'));
      expect(cseFees.length).toBe(1);
    });

    it('strips script tags before parsing', () => {
      const html = `<html><body>
        <script>$(function(){ dept.slick(); });</script>
        <table class="table"><tr><td>BSc</td><td>BDT 50,000</td></tr></table>
      </body></html>`;
      const result = engine._domExtract(html, null);
      // JS code must not appear in any field
      const allText = JSON.stringify(result);
      expect(allText).not.toMatch(/slick|function\s*\(/);
    });

    it('strips nav tags before parsing', () => {
      const html = `<html><body>
        <nav>Apply Now Undergraduate Admission Postgraduate</nav>
        <section class="eligibility">
          <p>Minimum GPA: 4.0 required for admission to the program</p>
        </section>
      </body></html>`;
      const result = engine._domExtract(html, null);
      // Nav text must not pollute any eligibility or admission field
      const allText = JSON.stringify(result);
      expect(allText).not.toMatch(/Undergraduate Admission Postgraduate/);
    });

    it('returns empty result for blank HTML', () => {
      const result = engine._domExtract('<html><body></body></html>', null);
      expect(result.tuitionFees).toHaveLength(0);
      expect(result.scholarships).toHaveLength(0);
    });
  });

  // ── _regexExtract ─────────────────────────────────────────────────────────
  describe('_regexExtract()', () => {

    it('extracts GPA from "Minimum GPA: X"', () => {
      const r = engine._regexExtract('Minimum GPA: 4.5 required for admission');
      expect(r.eligibility.minGPA).toBe('4.5');
    });

    it('extracts GPA from "at least 3.5 GPA"', () => {
      const r = engine._regexExtract('Students must have at least 3.5 GPA to enroll');
      expect(r.eligibility.minGPA).toBe('3.5');
    });

    it('does NOT store GPA outside 0.5–5.0 range', () => {
      const r = engine._regexExtract('Application deadline 2025, CGPA: 2025 not valid');
      expect(r.eligibility.minGPA).toBeNull();
    });

    it('extracts IELTS requirement with score', () => {
      const r = engine._regexExtract('IELTS score of 6.0 is required for admission');
      expect(r.eligibility.languageReqs).toMatch(/IELTS/i);
    });

    it('does NOT extract generic English sentence as languageReqs', () => {
      const r = engine._regexExtract('Students in the English department get great achievement');
      expect(r.eligibility.languageReqs).toBeNull();
    });

    it('extracts BDT amount as tuition fee when fee context present', () => {
      const r = engine._regexExtract('Tuition fee is BDT 45,000 per semester');
      expect(r.tuitionFees.length).toBeGreaterThan(0);
    });

    it('does NOT extract bare numbers without fee context', () => {
      const r = engine._regexExtract('The event took place in 2019 with 5000 attendees.');
      expect(r.tuitionFees).toHaveLength(0);
    });

    it('extracts admission deadline from plain text', () => {
      const r = engine._regexExtract('Last date to apply: 15 December 2025');
      expect(r.admission.applicationDeadline).toBeTruthy();
    });

    it('extracts intake months', () => {
      const r = engine._regexExtract('Spring 2025 and Fall 2025 intakes are open');
      expect(r.admission.intakeMonths).toMatch(/Spring|Fall/i);
    });

    it('returns empty arrays when nothing found', () => {
      const r = engine._regexExtract('No structured data here at all.');
      expect(r.tuitionFees).toHaveLength(0);
      expect(r.scholarships).toHaveLength(0);
    });
  });

  // ── computeAccuracy ───────────────────────────────────────────────────────
  describe('computeAccuracy()', () => {

    it('returns 100% when all 4 core fields present', () => {
      const { score, fieldsFound } = engine.computeAccuracy(FULL_RESULT);
      expect(score).toBe(100);
      expect(fieldsFound).toBe(4);
    });

    it('returns 50% when 2 of 4 fields present', () => {
      const partial = {
        admission:    { applicationDeadline: '30 Nov 2025' },
        tuitionFees:  [{ program: 'BSc', amountLocal: 45000 }],
        eligibility:  { minGPA: null, otherRequirements: null },
        scholarships: [],
      };
      expect(engine.computeAccuracy(partial).score).toBe(50);
    });

    it('returns 25% when only tuition fees found', () => {
      const r = engine._empty();
      r.tuitionFees = [{ program: 'BSc', amountLocal: 45000 }];
      expect(engine.computeAccuracy(r).score).toBe(25);
    });

    it('returns 0% for empty result', () => {
      expect(engine.computeAccuracy(engine._empty()).score).toBe(0);
    });

    it('counts admission as found when only applyUrl present (no deadline)', () => {
      const r = engine._empty();
      r.admission.applyUrl = 'https://apply.uni.edu';
      r.tuitionFees = [{ program: 'BSc', amountLocal: 45000 }];
      expect(engine.computeAccuracy(r).fieldsFound).toBe(2);
    });

    it('counts eligibility as found when otherRequirements present (no GPA)', () => {
      const r = engine._empty();
      r.eligibility.otherRequirements = 'SSC and HSC pass required';
      expect(engine.computeAccuracy(r).fieldsFound).toBe(1);
    });
  });

  // ── _coreComplete ─────────────────────────────────────────────────────────
  describe('_coreComplete()', () => {

    it('returns true when all 4 core categories have data', () => {
      expect(engine._coreComplete(FULL_RESULT)).toBe(true);
    });

    it('returns false when any core category is missing', () => {
      const r = { ...FULL_RESULT, scholarships: [] };
      expect(engine._coreComplete(r)).toBe(false);
    });

    it('returns false for empty result', () => {
      expect(engine._coreComplete(engine._empty())).toBe(false);
    });

    it('returns true with only requirementsText (no deadline) for admission', () => {
      const r = {
        admission:    { applicationDeadline: null, requirementsText: 'Apply online', applyUrl: null, intakeMonths: null },
        tuitionFees:  [{ program: 'BSc', amountLocal: 45000 }],
        eligibility:  { minGPA: null, otherRequirements: 'SSC required' },
        scholarships: [{ name: 'Merit Scholarship' }],
      };
      expect(engine._coreComplete(r)).toBe(true);
    });
  });

  // ── _missing ──────────────────────────────────────────────────────────────
  describe('_missing()', () => {

    it('includes "admission" for empty result', () => {
      const m = engine._missing(engine._empty());
      expect(m).toContain('admission');
    });

    it('includes "tuitionFees" for empty result', () => {
      expect(engine._missing(engine._empty())).toContain('tuitionFees');
    });

    it('includes sub-fields for LLM hints', () => {
      const m = engine._missing(engine._empty());
      expect(m).toContain('admission.applicationDeadline');
      expect(m).toContain('eligibility.minGPA');
    });

    it('does not include "admission" when any admission field has data', () => {
      const r = engine._empty();
      r.admission.applyUrl = 'https://apply.uni.edu';
      expect(engine._missing(r)).not.toContain('admission');
    });

    it('returns empty array when all fields found', () => {
      expect(engine._missing(FULL_RESULT)).toHaveLength(0);
    });
  });

  // ── _merge ────────────────────────────────────────────────────────────────
  describe('_merge()', () => {

    it('merges tuition fees from source into target', () => {
      const target = engine._empty();
      const source = engine._empty();
      source.tuitionFees = [{ program: 'BSc', amountLocal: 45000 }];
      engine._merge(target, source);
      expect(target.tuitionFees).toHaveLength(1);
    });

    it('does not overwrite existing admission fields', () => {
      const target = engine._empty();
      target.admission.applicationDeadline = 'Dec 2025';
      const source = engine._empty();
      source.admission.applicationDeadline = 'Jan 2026';
      engine._merge(target, source);
      expect(target.admission.applicationDeadline).toBe('Dec 2025');
    });

    it('fills empty admission fields from source', () => {
      const target = engine._empty();
      const source = engine._empty();
      source.admission.applyUrl = 'https://apply.uni.edu';
      engine._merge(target, source);
      expect(target.admission.applyUrl).toBe('https://apply.uni.edu');
    });
  });

  // ── _mergeIfEmpty ─────────────────────────────────────────────────────────
  describe('_mergeIfEmpty()', () => {

    it('fills all missing admission fields individually', () => {
      const target = engine._empty();
      const source = {
        admission:    { applicationDeadline: 'Dec 2025', requirementsText: 'Apply online', applyUrl: null, intakeMonths: 'Spring' },
        tuitionFees:  [],
        eligibility:  { minGPA: null, languageReqs: null, otherRequirements: null },
        scholarships: [],
      };
      engine._mergeIfEmpty(target, source);
      expect(target.admission.applicationDeadline).toBe('Dec 2025');
      expect(target.admission.intakeMonths).toBe('Spring');
    });

    it('does not overwrite existing tuitionFees', () => {
      const target = engine._empty();
      target.tuitionFees = [{ program: 'Existing', amountLocal: 10000 }];
      const source = engine._empty();
      source.tuitionFees = [{ program: 'New', amountLocal: 20000 }];
      engine._mergeIfEmpty(target, source);
      expect(target.tuitionFees[0].program).toBe('Existing');
    });

    it('fills tuitionFees when target is empty', () => {
      const target = engine._empty();
      const source = engine._empty();
      source.tuitionFees = [{ program: 'BSc', amountLocal: 45000 }];
      engine._mergeIfEmpty(target, source);
      expect(target.tuitionFees).toHaveLength(1);
    });
  });

  // ── scrapeMultiple ────────────────────────────────────────────────────────
  describe('scrapeMultiple()', () => {

    it('stops after first URL when all core fields found', async () => {
      jest.spyOn(engine, 'scrape').mockResolvedValue({ ...FULL_RESULT });
      const urls = [
        'https://admissions.northsouth.edu/tuition',
        'https://www.northsouth.edu/resources/fao.html',
        'https://admissions.northsouth.edu/apply',
      ];
      const result = await engine.scrapeMultiple(urls);
      expect(engine.scrape).toHaveBeenCalledTimes(1);
      expect(result.tuitionFees.length).toBeGreaterThan(0);
      jest.restoreAllMocks();
    });

    it('continues to next URL when fields missing', async () => {
      const partial = engine._empty();
      partial.tuitionFees = [{ program: 'BSc', amountLocal: 45000 }];
      jest.spyOn(engine, 'scrape')
        .mockResolvedValueOnce({ ...partial })                // URL 1: partial
        .mockResolvedValueOnce({ ...FULL_RESULT });           // URL 2: complete
      const urls = ['https://uni.edu/fees', 'https://uni.edu/scholarships'];
      await engine.scrapeMultiple(urls);
      expect(engine.scrape).toHaveBeenCalledTimes(2);
      jest.restoreAllMocks();
    });

    it('merges data from multiple URLs', async () => {
      const result1 = engine._empty();
      result1.tuitionFees = [{ program: 'BSc', amountLocal: 45000 }];
      const result2 = engine._empty();
      result2.scholarships = [{ name: 'Merit Scholarship', amount: '50%', eligibility: 'top students', deadline: null }];
      result2.admission = { applicationDeadline: 'Dec 2025', intakeMonths: null, applyUrl: null, requirementsText: null };
      result2.eligibility = { minGPA: '4.0', languageReqs: null, otherRequirements: null };

      jest.spyOn(engine, 'scrape')
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2);

      const merged = await engine.scrapeMultiple(['https://uni.edu/fees', 'https://uni.edu/admission']);
      expect(merged.tuitionFees.length).toBeGreaterThan(0);
      expect(merged.scholarships.length).toBeGreaterThan(0);
      jest.restoreAllMocks();
    });

    it('skips failed URLs and continues', async () => {
      jest.spyOn(engine, 'scrape')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ...FULL_RESULT });
      const result = await engine.scrapeMultiple(['https://fail.edu', 'https://ok.edu']);
      expect(result.tuitionFees.length).toBeGreaterThan(0);
      jest.restoreAllMocks();
    });

    it('returns empty result when all URLs fail', async () => {
      jest.spyOn(engine, 'scrape').mockRejectedValue(new Error('All failed'));
      const result = await engine.scrapeMultiple(['https://fail.edu']);
      expect(result.tuitionFees).toHaveLength(0);
      jest.restoreAllMocks();
    });
  });

  // ── _htmlToText ───────────────────────────────────────────────────────────
  describe('_htmlToText()', () => {
    it('removes HTML tags', () => {
      const text = engine._htmlToText('<p>Hello <b>world</b></p>');
      expect(text).toMatch(/Hello.*world/);
    });

    it('removes script content', () => {
      const text = engine._htmlToText('<script>var x = 1;</script><p>Real content</p>');
      expect(text).not.toMatch(/var x/);
      expect(text).toMatch(/Real content/);
    });

    it('removes style content', () => {
      const text = engine._htmlToText('<style>.foo{color:red}</style><p>Content</p>');
      expect(text).not.toMatch(/color:red/);
    });

    it('collapses whitespace', () => {
      const text = engine._htmlToText('<p>  lots   of   spaces  </p>');
      expect(text.trim()).not.toMatch(/  /);
    });
  });
});