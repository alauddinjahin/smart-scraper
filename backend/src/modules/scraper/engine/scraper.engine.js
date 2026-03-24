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

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const logger = require('../../../shared/config/logger');
const { OPENAI_API_KEY, OPENROUTER_API_KEY } = require('../../../shared/config/env');
const { USER_AGENTS, PERIOD_MAP, GARBAGE_PATTERNS, DEFAULT_SELECTORS, RX, scholarshipRx, BAD_NAMES, BAD_AMOUNT_WORDS, navLinkWords, navPhrases, scholarshipSignals, admissionSignals } = require('../utils/constants');
const { llmExtractPrompts, visionExtractPrompts } = require('../utils/prompts');
const StrategyDetection = require('../strategies/detection');
const StrategyFetch = require('../strategies/fetch');
const llmDetection = require('../strategies/llm.client');

const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

class ScraperEngine {
  constructor() {
    this.http = axios.create({
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

    const ctx = Object.freeze({
      http: this.http,
      randomUA,
    });

    this.strategyDetection = new StrategyDetection(ctx);
    this.strategyFetch = new StrategyFetch(ctx);

  }

  async scrape(url, universityId = null) {
    logger.info(`[engine]: ${url}`);
    return new Promise((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error(`Scrape timeout (150s): ${url}`)), 150000
      );
      this._pipeline(url, universityId)
        .then(r => { clearTimeout(t); resolve(r); })
        .catch(e => { clearTimeout(t); reject(e); });
    });
  }

  async scrapeMultiple(urls, universityId = null) {
    const merged = this._empty();
    for (const url of urls) {
      try {
        const r = await this.scrape(url, universityId);
        if (r._strategy) merged._strategy = r._strategy;
        this._deepMerge(merged, r);
        if (this._coreComplete(merged)) {
          logger.info(`[engine]: All 4 core fields found after ${urls.indexOf(url) + 1} URL(s)`);
          break;
        }
      } catch (e) {
        logger.warn(`[engine]: URL failed: ${url} — ${e.message}`);
      }
    }
    return merged;
  }

  async _pipeline(url, universityId) {
    const fileType = this._fileType(url);
    let rawContent;

    if (fileType === 'html') {
      const strategy = await this.strategyDetection.resolveStrategy(url, universityId);
      rawContent = await this._fetchHtml(url, strategy);

      // Expose resolved strategy so SPA shell check knows what was intended
      const intendedAxios = rawContent.strategy === 'axios' && strategy === 'axios';
      if (intendedAxios && rawContent.html) {
        const h = rawContent.html;
        const isSpaShell = h.includes('<div id="root">')
          || h.includes('<div id="__next">')
          || h.includes('ng-version=')
          || h.includes('<app-root')
          || h.includes('__vue_app__')
          || h.includes('platformBrowserDynamic')
          || (h.includes('<div id="app">') && !h.includes('<table'));

        if (isSpaShell) {
          logger.info(`[pipeline] axios returned SPA shell for ${url} — upgrading to puppeteer`);
          try {
            const puppeteerHtml = await this._puppeteerFetch(url, randomUA());
            if (puppeteerHtml) {
              rawContent = { html: puppeteerHtml, method: 'puppeteer', strategy: 'puppeteer' };
              // Update DB config 
              if (universityId) await this.strategyDetection.saveStrategy(universityId, 'puppeteer').catch(() => { });
            }
          } catch (e) { logger.warn(`[pipeline] puppeteer upgrade failed: ${e.message}`); }
        }
      }
    } else {
      rawContent = await this._fetchBinary(url);
    }

    let html = '', text = '';
    switch (fileType) {
      case 'pdf': text = await this._parsePdf(rawContent.data); break;
      case 'image': break;
      case 'docx': text = await this._parseDocx(rawContent.data); break;
      default:
        html = rawContent.html;
        text = this._htmlToText(html);
    }

    const siteConfig = universityId ? await this.strategyDetection.loadConfig(universityId) : null;
    const result = this._empty();
    result._meta = {
      fetchMethod: rawContent.method,
      strategy: rawContent.strategy,
      fileType, url,
      scrapedAt: new Date().toISOString(),
    };

    // Layer 1: DOM extraction 
    if (html) {
      try { this._merge(result, this._domExtract(html, siteConfig)); }
      catch (e) { logger.warn(`[dom] ${e.message}`); }
    }

    // Layer 2: Regex extraction 
    if (text) this._mergeIfEmpty(result, this._regexExtract(text));

    // Layer 3: LLM — fills ALL remaining gaps 
    const hasLlmKey = !!(OPENAI_API_KEY || OPENROUTER_API_KEY);
    const missing = this._missing(result);

    if (!this._coreComplete(result) && missing.length > 0 && hasLlmKey) {
      const content = text || (html ? this._htmlToText(html) : '');
      if (content.length > 50) {
        try {
          const llmResult = await this._llmExtract(content, url, missing);
          if (llmResult) {
            this._mergeIfEmpty(result, llmResult);
            if (llmResult.scholarships?.length && !result.scholarships.length) {
              result.scholarships = llmResult.scholarships;
            }
          }
        } catch (e) {
          logger.warn(`[llm] ${e.message}`);
        }

        // Layer 5: self-heal
        if (universityId && html) {
          await this._healSelectors(html, universityId, result).catch(() => { });
        }
      }
    }

    if ((fileType === 'image' || (fileType === 'pdf' && !text.trim())) && hasLlmKey) {
      const mime = fileType === 'pdf' ? 'application/pdf' : this._mime(url);
      try {
        this._merge(result, await this._visionExtract(rawContent.data, mime));
      } catch (e) {
        logger.warn(`[vision] ${e.message}`);
      }
    }

    // Layer 4: Validate 
    this._validate(result);

    const { score, fieldsFound } = this.computeAccuracy(result);
    // const still = this._missing(result);
    const coreStill = ['admission', 'tuitionFees', 'eligibility', 'scholarships'].filter(cat => {
      if (cat === 'admission') return !(result.admission?.applicationDeadline || result.admission?.requirementsText || result.admission?.applyUrl || result.admission?.intakeMonths);
      if (cat === 'tuitionFees') return !result.tuitionFees?.length;
      if (cat === 'eligibility') return !(result.eligibility?.minGPA || result.eligibility?.otherRequirements);
      if (cat === 'scholarships') return !result.scholarships?.length;
      return false;
    });
    logger.info(
      `[engine]: ${rawContent.strategy || rawContent.method} | ` +
      `${fieldsFound}/4 fields (${score.toFixed(0)}%)` +
      `${coreStill.length ? ` | missing: ${coreStill.join(', ')}` : ' | COMPLETE'}`
    );

    result._strategy = result._meta?.strategy || rawContent.strategy || 'unknown';
    delete result._meta;
    return result;
  }

  _fetchHtml(url, strategy) {
    return this.strategyFetch.fetchHtml(url, strategy);
  }

  _fetchBinary(url) {
    return this.strategyFetch.fetchBinary(url);
  }

  _puppeteerFetch(url, ua) {
    return this.strategyFetch.puppeteerFetch(url, ua);
  }

  async _parsePdf(buffer) {
    try {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js').catch(() => require('pdf-parse'));
      const { text } = await pdfParse(buffer);
      return text;
    } catch (e) { logger.warn(`[pdf]: ${e.message}`); return ''; }
  }

  async _parseDocx(buffer) {
    try {
      const mammoth = require('mammoth');
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    } catch (e) { logger.warn(`[docx] ${e.message}`); return ''; }
  }

  _domExtract(html, siteConfig) {
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<(?:div|section|aside)[^>]*(?:class|id)="[^"]*(?:footer|copyright|bottom-bar|site-footer|page-footer)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section|aside)>/gi, '')
      .replace(/<(?:div|section|aside)[^>]*(?:class|id)='[^']*(?:footer|copyright|bottom-bar|site-footer|page-footer)[^']*'[^>]*>[\s\S]*?<\/(?:div|section|aside)>/gi, '');

    const $ = cheerio.load(cleanHtml);
    const sel = siteConfig?.selectors || DEFAULT_SELECTORS;
    const result = this._empty();

    // Admission 
    for (const s of (sel.admission || DEFAULT_SELECTORS.admission)) {
      try {
        const el = $(s).first();
        if (!el.length) continue;
        const text = el.text().replace(/\s+/g, ' ').trim();
        let found = false;
        for (const p of RX.deadline) {
          p.lastIndex = 0;
          const m = p.exec(text);
          if (m) { result.admission.applicationDeadline = m[1].trim(); found = true; break; }
        }
        // Apply URL 
        const link = el.find(
          'a[href*="apply"], a[href*="admission"], a[href*="application"],' +
          'a[href*="enroll"], a[href*="register"],' +
          'a:contains("Apply"), a:contains("Apply Now"), a:contains("Apply Online"),' +
          'a:contains("Register"), a:contains("Enroll")'
        ).first().attr('href');
        if (link) { result.admission.applyUrl = link; found = true; }

        // intakeMonths - extract from admission section text
        if (!result.admission.intakeMonths) {
          RX.intake.lastIndex = 0;
          const intakeMatches = [];
          let im;
          while ((im = RX.intake.exec(text)) !== null) intakeMatches.push(im[0]);
          if (intakeMatches.length) {
            result.admission.intakeMonths = [...new Set(intakeMatches)].slice(0, 4).join(', ');
            found = true;
          }
        }

        // Also extract requirementsText if this looks like an admission section
        if (!result.admission.requirementsText && text.length > 50) {
          const hasAdmissionKeyword = /admission|require|eligib|applicant|apply|enroll|qualification|deadline|intake|semester|program/i.test(text);
          if (hasAdmissionKeyword && !this._isNavContent(text)) {
            result.admission.requirementsText = text.slice(0, 800);
            found = true;
          }
        }
        // Break early only if deadline found (high-value) or all fields complete
        const allAdmFull = result.admission.applicationDeadline
          && result.admission.requirementsText
          && result.admission.applyUrl
          && result.admission.intakeMonths;
        if (result.admission.applicationDeadline || allAdmFull) break;
      } catch (error) { }
    }

    // Tuition fees 
    const seen = new Set();
    for (const s of (sel.tuition || DEFAULT_SELECTORS.tuition)) {
      try {
        $(s).each((_i, table) => {
          $(table).find('tr').each((_j, row) => {
            const cells = $(row).find('td');
            if (cells.length < 2) return;
            const program = $(cells[0]).text().replace(/\s+/g, ' ').trim();
            if (!this._validProgram(program)) return;
            const rowText = $(row).text();
            for (let c = 1; c < Math.min(cells.length, 4); c++) {
              const cell = $(cells[c]).text().trim();
              RX.amountPrefix.lastIndex = 0;
              let match = RX.amountPrefix.exec(cell);
              if (!match) { RX.amountRaw.lastIndex = 0; match = RX.amountRaw.exec(cell); }
              if (!match) continue;
              const amount = parseFloat(match[1].replace(/,/g, ''));
              if (!this._validAmount(amount)) continue;
              const key = `${program.toLowerCase()}:${amount}`;
              if (seen.has(key)) continue;
              seen.add(key);
              result.tuitionFees.push({
                program: program.slice(0, 100),
                amountLocal: amount,
                currency: (cell.includes('$') || cell.includes('USD')) ? 'USD' : 'BDT',
                period: this._detectPeriod(program, cell, rowText),
              });
              break;
            }
          });
        });
      } catch { }
      if (result.tuitionFees.length >= 30) break;
    }

    if (result.tuitionFees.length === 0) {
      $('dl').each((_i, dl) => {
        const dts = $(dl).find('dt');
        const dds = $(dl).find('dd');
        dts.each((j, dt) => {
          const program = $(dt).text().replace(/\s+/g, ' ').trim();
          if (!this._validProgram(program)) return;
          const val = $(dds.get(j) || dds.last()).text().trim();
          RX.amountPrefix.lastIndex = 0;
          let match = RX.amountPrefix.exec(val);
          if (!match) { RX.amountRaw.lastIndex = 0; match = RX.amountRaw.exec(val); }
          if (!match) return;
          const amount = parseFloat(match[1].replace(/,/g, ''));
          if (!this._validAmount(amount)) return;
          result.tuitionFees.push({
            program: program.slice(0, 100),
            amountLocal: amount,
            currency: val.includes('$') || val.includes('USD') ? 'USD' : 'BDT',
            period: this._detectPeriod(program, val, ''),
          });
        });
      });

      const feeListRx = /^([A-Za-z][^:\-–]{2,50})[:\-–]\s*(?:BDT|Tk\.?|৳|Taka)?\s*([\d,]+)/;
      $('li, p').each((_i, el) => {
        const raw = $(el).text().replace(/\s+/g, ' ').trim();
        if (raw.length < 5 || raw.length > 200) return;
        const m = feeListRx.exec(raw);
        if (!m) return;
        const program = m[1].trim();
        if (!this._validProgram(program)) return;
        const amount = parseFloat(m[2].replace(/,/g, ''));
        if (!this._validAmount(amount)) return;
        result.tuitionFees.push({
          program: program.slice(0, 100),
          amountLocal: amount,
          currency: raw.includes('$') || raw.includes('USD') ? 'USD' : 'BDT',
          period: this._detectPeriod(program, raw, ''),
        });
        if (result.tuitionFees.length >= 30) return false;
      });
    }

    // Eligibility 
    for (const s of (sel.eligibility || DEFAULT_SELECTORS.eligibility)) {
      try {
        const el = $(s).first();
        if (!el.length) continue;
        const text = el.text().replace(/\s+/g, ' ').trim();
        if (text.length < 20) continue;
        for (const p of RX.gpa) {
          p.lastIndex = 0;
          const m = p.exec(text);
          if (m) {
            const val = parseFloat(m[1]);
            if (!isNaN(val) && val >= 0.5 && val <= 5.0) {
              result.eligibility.minGPA = m[1];
              break;
            }
          }
        }

        if (!result.eligibility.minGPA) {
          const divRx = /(?:minimum|at\s+least)\s+(?:Division|Class|Grade)\s+(1st|2nd|3rd|First|Second|Third|[A-C]\+?)/gi;
          divRx.lastIndex = 0;
          const divM = divRx.exec(text);
          if (divM) result.eligibility.minGPA = divM[0].trim().slice(0, 50);
        }

        RX.language.lastIndex = 0;
        const lm = RX.language.exec(text);
        if (lm) {
          const lmText = lm[0].trim();
          const isRealLangReq = /\d|band|score|level|minimum|required|certificate|exempt|waiv/i.test(lmText)
            || /IELTS|TOEFL|TOEIC|GMAT|GRE|SAT|Duolingo/i.test(lmText);
          if (isRealLangReq) {
            result.eligibility.languageReqs = lmText.slice(0, 300);
          }
        }

        // Route text to the correct destination using context signals
        if (text.length > 30) {
          const hasEligKeyword = /gpa|grade|result|ssc|hsc|a level|o level|equivalent|minimum|require|qualify|english|ielts|toefl|cgpa|degree|bachelor|diploma|score|passing/i.test(text);
          if (hasEligKeyword && !this._isNavContent(text)) {
            const dest = this._classifyEligibilityText(text);
            if (dest === 'scholarship') {
              const scholName = el.find('h2,h3,h4,strong').first().text().trim()
                || 'Scholarship Eligibility';
              if (!this._isNavContent(scholName)) {
                result.scholarships.push({
                  name: scholName.slice(0, 255),
                  amount: null,
                  eligibility: text.slice(0, 600),
                  deadline: null,
                });
              }
            } else if (dest === 'admission') {
              if (!result.admission.requirementsText) {
                result.admission.requirementsText = text.slice(0, 800);
              }
            } else {
              if (!result.eligibility.otherRequirements) {
                result.eligibility.otherRequirements = text.slice(0, 600);
              }
            }
          }
        }
        if (result.eligibility.minGPA) break;
      } catch { }
    }

    // Scholarships 
    const seenScholarship = new Set();
    for (const s of (sel.scholarship || DEFAULT_SELECTORS.scholarship)) {
      try {
        $(s).each((_i, el) => {
          const text = $(el).text().replace(/\s+/g, ' ').trim();
          if (this._isNavContent(text) || text.length < 20) return;
          const key = text.slice(0, 80).toLowerCase();
          if (seenScholarship.has(key)) return;
          seenScholarship.add(key);
          const innerHeading = $(el).find('h2,h3,h4,h5,strong,b,caption,dt,label').first().text().trim();
          const parentHeading = $(el).closest('section,article,div').find('h2,h3,h4').first().text().trim();
          const prevHeading = $(el).prev('h2,h3,h4,h5').text().trim()
            || $(el).prevAll('h2,h3,h4,h5').first().text().trim();
          const attrTitle = $(el).attr('aria-label') || $(el).attr('title') || '';
          const idTitle = ($(el).attr('id') || '').replace(/[-_]/g, ' ').trim();

          const GENERIC_NAME_RX = /^(scholarship|financial aid|scholarships and financial aid|policies|aid|grant|waiver|read more|apply|funding|bursary|freeship)$/i;
          const candidateNames = [innerHeading, prevHeading, parentHeading, attrTitle, idTitle]
            .map(n => n.trim())
            .filter(n => n.length >= 5 && n.length <= 255 && !this._isNavContent(n) && !GENERIC_NAME_RX.test(n));

          const amountEl = $(el).find('[class*="amount"],[class*="percent"],[class*="waiver"],td').first();
          const rawAmount = amountEl.text().trim();
          const isRealAmount = rawAmount.length > 0
            && /\d|%|BDT|Tk|৳|waiver|full|partial/i.test(rawAmount)
            && rawAmount.length < 80;
          const amount = isRealAmount ? rawAmount.slice(0, 100) : null;

          const eligText = text.slice(0, 600);
          if (this._isNavContent(eligText)) return;

          const hasScholarKeyword = /scholarship|waiver|grant|aid|bursary|stipend|fellowship|financial|concession|merit|award|remission|freeship|funding|donate|empow|disadvantaged/i.test(eligText);
          if (!hasScholarKeyword) return;

          let finalName = candidateNames[0] || null;

          if (!finalName) {
            const lines = eligText.split(/\n|(?<=[.!?])\s+/);
            for (const line of lines) {
              const l = line.trim();
              if (l.length >= 8 && l.length <= 100
                && /^[A-Z]/.test(l)
                && !this._isNavContent(l)
                && !GENERIC_NAME_RX.test(l)
                && /scholarship|waiver|grant|aid|merit|award|fellowship|bursary|freeship|financial/i.test(l)) {
                finalName = l;
                break;
              }
            }
          }

          if (!finalName) return;

          result.scholarships.push({
            name: finalName.slice(0, 255),
            amount,
            eligibility: eligText || null,
            deadline: null,
          });
        });
        if (result.scholarships.length >= 8) break;
      } catch { }
    }

    return result;
  }

  _regexExtract(text) {
    const result = this._empty();

    // Deadline
    for (const p of RX.deadline) {
      p.lastIndex = 0;
      const m = p.exec(text);
      if (m) { result.admission.applicationDeadline = m[1].trim(); break; }
    }

    // Intake months
    RX.intake.lastIndex = 0;
    const intakes = [];
    let m;
    while ((m = RX.intake.exec(text)) !== null) intakes.push(m[0]);
    if (intakes.length)
      result.admission.intakeMonths = [...new Set(intakes)].slice(0, 4).join(', ');

    // GPA - only store if value is in a plausible GPA range (0.5–5.0)
    for (const p of RX.gpa) {
      p.lastIndex = 0;
      const g = p.exec(text);
      if (g) {
        const val = parseFloat(g[1]);
        if (!isNaN(val) && val >= 0.5 && val <= 5.0) {
          result.eligibility.minGPA = g[1];
          break;
        }
      }
    }

    // Language requirements 
    RX.language.lastIndex = 0;
    const lang = RX.language.exec(text);
    if (lang) {
      const langText = lang[0].trim();
      const isRealLangReq = /\d|band|score|level|minimum|required|certificate|exempt|waiv/i.test(langText)
        || /IELTS|TOEFL|TOEIC|GMAT|GRE|SAT|Duolingo/i.test(langText);
      if (isRealLangReq) {
        result.eligibility.languageReqs = langText.slice(0, 200);
      }
    }

    if (!result.admission.applyUrl) {
      const applyRx = /https?:\/\/[^\s"'<>]+(?:apply|admission|application|register|enroll)[^\s"'<>]*/gi;
      applyRx.lastIndex = 0;
      const applyM = applyRx.exec(text);
      if (applyM) result.admission.applyUrl = applyM[0].slice(0, 500);
    }

    // requirementsText 
    if (!result.admission.requirementsText) {
      const reqRx = /(?:admission\s+requirements?|eligibility\s+criteria|minimum\s+qualification|entry\s+requirements?|who\s+can\s+apply)[^.]{0,600}/gi;
      reqRx.lastIndex = 0;
      const reqM = reqRx.exec(text);
      if (reqM && reqM[0].length > 30) {
        result.admission.requirementsText = reqM[0].trim().slice(0, 800);
      }
    }

    // otherRequirements / admission.requirementsText from plain text 
    const eligRx = /(?:SSC|HSC|O\s+Level|A\s+Level|12th|higher\s+secondary|secondary\s+school|minimum\s+qualification|entry\s+requirement|who\s+can\s+apply|admission\s+criteria|scholarship\s+eligibility|award\s+criteria)[^.]{0,400}/gi;
    eligRx.lastIndex = 0;
    let eligM;
    while ((eligM = eligRx.exec(text)) !== null) {
      const chunk = eligM[0].trim();
      if (chunk.length < 20) continue;
      const dest = this._classifyEligibilityText(chunk);
      if (dest === 'scholarship' && result.scholarships.length < 10) {
        // Scholarship eligibility — add as a new scholarship entry
        const pctMatch = chunk.match(/(\d+(?:\.\d+)?\s*%)/);
        result.scholarships.push({
          name: chunk.slice(0, 255).trim(),
          amount: pctMatch?.[1] || null,
          eligibility: chunk.slice(0, 400),
          deadline: null,
        });
      } else if (dest === 'admission' && !result.admission.requirementsText) {
        result.admission.requirementsText = chunk.slice(0, 800);
      } else if (dest === 'eligibility' && !result.eligibility.otherRequirements) {
        result.eligibility.otherRequirements = chunk.slice(0, 600);
      }
    }

    // Scholarship regex 
    const seenS = new Set();
    for (const p of scholarshipRx) {
      p.lastIndex = 0;
      let sm;
      while ((sm = p.exec(text)) !== null && result.scholarships.length < 10) {
        const matched = sm[0].trim();
        if (matched.length < 10) continue;

        // Extract percentage amount if present
        const pctMatch = matched.match(/(\d+(?:\.\d+)?\s*%)/);
        const bdtMatch = matched.match(/(?:BDT|Tk\.?|৳|Taka)\s*([\d,]+)/i);
        const amount = pctMatch?.[1] || (bdtMatch ? `${bdtMatch[0].trim()}` : null);

        const nameMatch = matched.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Scholarship|Waiver|Aid|Stipend|Fellowship|Grant|Bursary|Concession|Assistantship|Freeship))/);
        const name = (nameMatch?.[1] || matched.slice(0, 255)).trim();
        if (seenS.has(name.toLowerCase())) continue;
        seenS.add(name.toLowerCase());
        result.scholarships.push({
          name,
          amount,
          eligibility: matched.length > 80 ? matched.slice(0, 400) : null,
          deadline: null,
        });
      }
    }

    if (result.tuitionFees.length === 0) {
      const hasFeeContext = /fee|tuition|credit|semester|cost|charge|payment|BDT|Tk\.?|৳/i.test(text);
      if (hasFeeContext) {
        RX.amountRaw.lastIndex = 0;
        const amounts = [];
        while ((m = RX.amountRaw.exec(text)) !== null) {
          const v = parseFloat(m[1].replace(/,/g, ''));
          if (this._validAmount(v)) amounts.push(v);
        }
        if (amounts.length) {
          [...new Set(amounts)].slice(0, 10).forEach((amt, i) => {
            result.tuitionFees.push({
              program: `Program ${i + 1}`, amountLocal: amt, currency: 'BDT', period: 'per semester',
            });
          });
        }
      }
    }

    return result;
  }

  // Primary LLM extraction 
  async _llmExtract(text, url, missingFields) {
    const hasScholarshipHint = /scholarship|financial aid|waiver|grant|stipend|fellowship|discount/i.test(text);

    const clean = text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);

    const { client, model } = llmDetection.makeLlmClient();

    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: llmExtractPrompts.system(hasScholarshipHint),
        },
        {
          role: 'user',
          content: llmExtractPrompts.user({ url, missingFields, clean }),
        },
      ],
      temperature: 0,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    let raw = res.choices?.[0]?.message?.content || '{}';
    raw = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  }

  // Vision extraction 
  async _visionExtract(buffer, mimeType) {
    const { client, model } = llmDetection.makeLlmClient();
    logger.info(`[vision]: Processing ${mimeType}`);

    const res = await client.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: visionExtractPrompts.user(),
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${buffer.toString('base64')}`,
              detail: 'high',
            },
          },
        ],
      }],
      max_tokens: 2000,
    });

    const raw = (res.choices?.[0]?.message?.content || '{}').replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  }


  _validate(result) {
    // Dedup tuition fees
    const seen = new Set();
    result.tuitionFees = result.tuitionFees.filter(f => {
      const k = `${(f.program || '').toLowerCase().trim()}:${f.amountLocal}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return this._validProgram(f.program) && this._validAmount(f.amountLocal);
    });

    if (result.eligibility?.otherRequirements) {
      const c = result.eligibility.otherRequirements.replace(/\s+/g, ' ').trim();
      const hasEligWord = /gpa|cgpa|ssc|hsc|o level|a level|degree|diploma|bachelor|master|minimum|equivalent|grade|result|score|qualification|passing/i.test(c);
      result.eligibility.otherRequirements = (c.length > 30 && hasEligWord && !this._isNavContent(c)) ? c : null;
    }

    if (result.eligibility?.languageReqs) {
      const c = result.eligibility.languageReqs.replace(/\s+/g, ' ').trim();
      const isRealLang = /IELTS|TOEFL|TOEIC|GMAT|GRE|SAT|Duolingo|\d|band|score|proficiency|medium/i.test(c);
      result.eligibility.languageReqs = (c.length > 5 && isRealLang) ? c : null;
    }

    if (result.eligibility?.minGPA) {
      const val = parseFloat(result.eligibility.minGPA);
      // Drop if not a plausible GPA value
      if (isNaN(val) || val < 0.5 || val > 5.0) {
        result.eligibility.minGPA = null;
      }
    }

    result.scholarships = result.scholarships.filter(s => {
      if (!s.name || s.name.length < 5) return false;
      if (BAD_NAMES.test(s.name.trim())) return false;
      if (this._isNavContent(s.name)) return false;
      if (this._isNavContent(s.eligibility || '')) return false;
      if (s.amount && BAD_AMOUNT_WORDS.test(s.amount.trim())) return false;
      if (s.amount && this._isNavContent(s.amount)) return false;
      // Eligibility must contain a real scholarship keyword if present
      if (s.eligibility) {
        const hasKeyword = /scholarship|waiver|grant|aid|bursary|stipend|fellowship|financial|concession|merit|award|remission|freeship|funding|donate|empow|disadvantaged/i.test(s.eligibility);
        if (!hasKeyword) return false;
        if (s.eligibility.trim().length < 20) return false;
      }
      return true;
    });

    if (result.eligibility) {
      const gpa = result.eligibility.minGPA;
      if (gpa !== null && gpa !== undefined && typeof gpa !== 'string') {
        result.eligibility.minGPA = String(gpa);
      }
    }
    if (result.admission) {
      const im = result.admission.intakeMonths;
      if (Array.isArray(im)) {
        result.admission.intakeMonths = im.filter(Boolean).join(', ') || null;
      }
    }
    result.scholarships = result.scholarships.map(s => ({
      ...s,
      amount: (s.amount !== null && s.amount !== undefined && typeof s.amount !== 'string')
        ? String(s.amount)
        : s.amount,
    }));

    // Dedup scholarships by name
    const seenNames = new Set();
    result.scholarships = result.scholarships.filter(s => {
      const k = s.name.toLowerCase().trim();
      if (seenNames.has(k)) return false;
      seenNames.add(k);
      return true;
    });
  }



  async _healSelectors(html, universityId, llmResult) {
    try {
      const $ = cheerio.load(html);
      const newSel = {};

      // Heal tuition: find table containing a known program name
      if (llmResult.tuitionFees?.length) {
        const first = llmResult.tuitionFees[0]?.program;
        if (first && first !== 'Program 1') {
          $('table').each((_, t) => {
            if ($(t).text().includes(first)) {
              const cls = $(t).attr('class');
              if (cls) { newSel.tuition = [`.${cls.split(' ')[0]}`]; return false; }
            }
          });
        }
      }

      // Heal admission: find element containing deadline or requirementsText
      if (llmResult.admission?.applicationDeadline || llmResult.admission?.requirementsText) {
        const hint = llmResult.admission.applicationDeadline || llmResult.admission.requirementsText?.slice(0, 40);
        if (hint) {
          $('div, section, article').each((_, el) => {
            if ($(el).text().includes(hint)) {
              const cls = $(el).attr('class');
              const id = $(el).attr('id');
              if (id) { newSel.admission = [`#${id}`]; return false; }
              if (cls) { newSel.admission = [`.${cls.split(' ')[0]}`]; return false; }
            }
          });
        }
      }

      // Heal eligibility: find element containing minGPA or otherRequirements snippet
      if (llmResult.eligibility?.minGPA || llmResult.eligibility?.otherRequirements) {
        const hint = llmResult.eligibility.minGPA || llmResult.eligibility.otherRequirements?.slice(0, 40);
        if (hint) {
          $('div, section, table').each((_, el) => {
            if ($(el).text().includes(hint)) {
              const cls = $(el).attr('class');
              const id = $(el).attr('id');
              if (id) { newSel.eligibility = [`#${id}`]; return false; }
              if (cls) { newSel.eligibility = [`.${cls.split(' ')[0]}`]; return false; }
            }
          });
        }
      }

      // Heal scholarship: find element containing first scholarship name
      if (llmResult.scholarships?.length) {
        const hint = llmResult.scholarships[0]?.name?.slice(0, 40);
        if (hint) {
          $('div, section, ul').each((_, el) => {
            if ($(el).text().includes(hint)) {
              const cls = $(el).attr('class');
              const id = $(el).attr('id');
              if (id) { newSel.scholarship = [`#${id}`]; return false; }
              if (cls) { newSel.scholarship = [`.${cls.split(' ')[0]}`]; return false; }
            }
          });
        }
      }

      if (!Object.keys(newSel).length) return;

      const existingConfig = await this.strategyDetection.loadConfig(universityId);
      const config = {
        ...(existingConfig || {}),
        selectors: { ...(existingConfig?.selectors || {}), ...newSel },
        healedAt: new Date().toISOString(),
      };

      await this.strategyDetection.saveStrategy(universityId, existingConfig?.strategy || 'auto', config);
     
      logger.info(`[heal]: Saved selectors for university ${universityId}`);
    } catch (e) {
      logger.warn(`[heal]: ${e.message}`);
    }
  }




  computeAccuracy(result) {
    let found = 0;
    // Admission: count as found if ANY admission field has data
    const hasAnyAdmission = !!(
      result.admission?.applicationDeadline ||
      result.admission?.requirementsText ||
      result.admission?.applyUrl ||
      result.admission?.intakeMonths
    );
    if (hasAnyAdmission) found++;
    if (result.tuitionFees?.length) found++;
    // Eligibility: count as found if minGPA OR otherRequirements has data
    const hasEligibility = !!(result.eligibility?.minGPA || result.eligibility?.otherRequirements);
    if (hasEligibility) found++;
    if (result.scholarships?.length) found++;
    return { score: (found / 4) * 100, fieldsFound: found, fieldsTotal: 4 };
  }

  _fileType(url) {
    const u = url.toLowerCase().split('?')[0];
    const e = path.extname(u);
    if (e === '.pdf') return 'pdf';
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(e)) return 'image';
    if (['.docx', '.doc'].includes(e)) return 'docx';
    return 'html';
  }

  _mime(url) {
    const e = path.extname(url.toLowerCase().split('?')[0]);
    return e === '.png' ? 'image/png' : e === '.webp' ? 'image/webp' : 'image/jpeg';
  }

  _htmlToText(html) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  _detectPeriod(program, cell, row) {
    const t = `${program} ${cell} ${row}`.toLowerCase();
    for (const [period, kws] of Object.entries(PERIOD_MAP))
      if (kws.some(k => t.includes(k))) return period;
    return 'per semester';
  }

  _validProgram(t) {
    if (!t || t.length < 2 || t.length > 100) return false;
    if (t.includes('\n') || t.split(' ').length > 12) return false;
    if (GARBAGE_PATTERNS.some(p => p.test(t))) return false;
    if (/tk\.\s*\d/i.test(t)) return false;
    return true;
  }

  _validAmount(v) {
    return typeof v === 'number' && !isNaN(v) && v >= 500 && v <= 10_000_000;
  }

  _isNavContent(t) {
    if (!t) return false;
    const s = t.toLowerCase().trim();

    // Reject raw JavaScript code
    if (/function\s*\(|\$\(function|\$\.fn\.|\.slick\(|jQuery|addEventListener|document\.get/i.test(t)) return true;
    if (/\{[\s\S]{0,30}autoplay|slideshow|carousel|\.length\)/i.test(t)) return true;

    let navLinkCount = 0;
    for (const w of navLinkWords) {
      if (s.includes(w)) navLinkCount++;
    }
    if (navLinkCount >= 2) return true;

    if (navPhrases.some(w => s.includes(w))) return true;

    const genericLabels = [
      'scholarships and financial aid', 'financial aid', 'policies',
      'read eligibility', 'read more', 'click here', 'learn more',
    ];
    if (genericLabels.some(w => s === w || s.trim() === w)) return true;

    const words = s.split(/\s+/).filter(w => w.length > 2);
    const navSet = new Set([
      'admission', 'undergraduate', 'postgraduate', 'apply', 'fees', 'faq',
      'brochure', 'enrollment', 'tuition', 'international', 'applicants',
      'counseling', 'wellness', 'accommodation', 'offices', 'centres', 'clubs',
      'news', 'announcements', 'media', 'community', 'policies', 'procedures',
    ]);
    if (words.length > 0 && words.length < 25) {
      const navWordCount = words.filter(w => navSet.has(w)).length;
      if (navWordCount / words.length > 0.35) return true;
    }

    return false;
  }


  _classifyEligibilityText(text) {
    const s = text.toLowerCase();

    const hasScholarshipSignal = scholarshipSignals.some(w => s.includes(w));

    const hasAdmissionSignal = admissionSignals.some(w => s.includes(w));

    // Routing decision
    if (hasScholarshipSignal && !hasAdmissionSignal) return 'scholarship';
    if (hasScholarshipSignal && hasAdmissionSignal) return 'scholarship';
    if (hasAdmissionSignal) return 'admission';
    return 'eligibility';
  }

  _empty() {
    return {
      admission: { applicationDeadline: null, intakeMonths: null, applyUrl: null, requirementsText: null },
      tuitionFees: [],
      eligibility: { minGPA: null, languageReqs: null, otherRequirements: null },
      scholarships: [],
    };
  }

  _merge(target, source) {
    if (source.admission)
      for (const [k, v] of Object.entries(source.admission))
        if (v && !target.admission[k]) target.admission[k] = v;
    if (source.tuitionFees?.length) target.tuitionFees.push(...source.tuitionFees);
    if (source.eligibility)
      for (const [k, v] of Object.entries(source.eligibility))
        if (v && !target.eligibility[k]) target.eligibility[k] = v;
    if (source.scholarships?.length) target.scholarships.push(...source.scholarships);
  }

  _mergeIfEmpty(target, source) {
    if (source?.admission) {
      const admFields = ['applicationDeadline', 'requirementsText', 'intakeMonths', 'applyUrl'];
      for (const f of admFields) {
        if (!target.admission[f] && source.admission[f]) {
          target.admission[f] = source.admission[f];
        }
      }
    }
    if (!target.tuitionFees.length && source?.tuitionFees?.length)
      target.tuitionFees = source.tuitionFees;
    // Eligibility: merge ANY missing field, not just minGPA
    if (source?.eligibility) {
      const eligFields = ['minGPA', 'languageReqs', 'otherRequirements'];
      for (const f of eligFields) {
        if (!target.eligibility[f] && source.eligibility[f]) {
          target.eligibility[f] = source.eligibility[f];
        }
      }
    }
    if (!target.scholarships.length && source?.scholarships?.length)
      target.scholarships = source.scholarships;
  }

  _deepMerge(target, source) { this._merge(target, source); }


  _coreComplete(result) {
    const hasAdmission = !!(
      result.admission?.applicationDeadline ||
      result.admission?.requirementsText ||
      result.admission?.applyUrl ||
      result.admission?.intakeMonths
    );
    const hasEligibility = !!(
      result.eligibility?.minGPA || result.eligibility?.otherRequirements
    );
    return hasAdmission
      && result.tuitionFees?.length > 0
      && hasEligibility
      && result.scholarships?.length > 0;
  }

  // missing func: returns field hints sent to the LLM so it knows what to look for.
  _missing(result) {
    const m = [];
    const hasAnyAdmission = !!(
      result.admission?.applicationDeadline ||
      result.admission?.requirementsText ||
      result.admission?.applyUrl ||
      result.admission?.intakeMonths
    );
    if (!hasAnyAdmission) m.push('admission');
    if (!result.admission?.applicationDeadline) m.push('admission.applicationDeadline');
    if (!result.admission?.requirementsText) m.push('admission.requirementsText');
    if (!result.admission?.applyUrl) m.push('admission.applyUrl');
    if (!result.tuitionFees?.length) m.push('tuitionFees');
    if (!result.eligibility?.minGPA) m.push('eligibility.minGPA');
    if (!result.eligibility?.otherRequirements) m.push('eligibility.otherRequirements');
    if (!result.scholarships?.length) m.push('scholarships');
    return m;
  }




}

module.exports = new ScraperEngine();