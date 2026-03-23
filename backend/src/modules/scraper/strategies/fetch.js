const logger = require('../../../shared/config/logger');
const { ZENROWS_API_KEY } = require('../../../shared/config/env');
const { contentSelectors } = require('../utils/constants');
const BaseStrategy = require('./base');
const delay = ms => new Promise(r => setTimeout(r, ms));
const randomDelay = (a, b) => delay(a + Math.random() * (b - a));

class StrategyFetch extends BaseStrategy {

    constructor(ctx) {
        super(ctx); 
    }

    async fetchHtml(url, strategy) {
        const ua = this.randomUA();
        const isHashRoute = url.includes('/#/') || url.includes('#!');

        const order = isHashRoute
            ? (ZENROWS_API_KEY ? ['puppeteer', 'zenrows'] : ['puppeteer'])
            : strategy === 'zenrows'
                ? ['zenrows', 'puppeteer', 'axios']
                : strategy === 'puppeteer'
                    ? ['puppeteer', 'zenrows']
                    : ['axios', 'puppeteer', 'zenrows'];

        for (const s of order) {
            try {
                if (s === 'axios') {
                    const r = await this._axiosFetch(url, ua);
                    if (r) return { ...r, strategy: s };
                }
                if (s === 'puppeteer') {
                    const html = await this.puppeteerFetch(url, ua);
                    if (html) return { html, method: 'puppeteer', strategy: s };
                }
                if (s === 'zenrows' && ZENROWS_API_KEY) {
                    const html = await this._zenrowsFetch(url);
                    if (html) return { html, method: 'zenrows', strategy: s };
                }
            } catch (e) { logger.warn(`[${s}] Failed: ${e.message}`); }
        }
        throw new Error(`All fetch strategies exhausted for ${url}`);
    }

    async _axiosFetch(url, ua) {
        for (let i = 1; i <= 2; i++) {
            try {
                await randomDelay(500 * i, 1200 * i);
                const res = await this.http.get(url, { headers: { 'User-Agent': ua }, maxRedirects: 5 });
                const html = Buffer.from(res.data).toString('utf-8');
                if (res.status === 200 && html) { logger.info(`[axios] OK: ${url}`); return { html, method: 'axios' }; }
            } catch (e) {
                const s = e.response?.status;
                logger.warn(`[axios]: attempt ${i} → ${s || e.message}`);
                if (s !== 403 && s !== 429 && s !== 503) throw e;
            }
        }
        return null;
    }

    async puppeteerFetch(url, ua) {
        let puppeteer;
        try {
            puppeteer = require('puppeteer-extra');
            puppeteer.use(require('puppeteer-extra-plugin-stealth')());
        } catch { logger.warn('[puppeteer] Not installed'); return null; }

        const task = async () => {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox', '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', '--disable-gpu',
                    '--disable-blink-features=AutomationControlled',
                    '--window-size=1366,768',
                ],
            });
            try {
                const page = await browser.newPage();
                await page.setViewport({ width: 1366, height: 768 });
                await page.setUserAgent(ua);

                // Block only heavy binary resources - keep JS, CSS, XHR, fetch
                await page.setRequestInterception(true);
                page.on('request', r => {
                    const type = r.resourceType();
                    if (['image', 'font', 'media'].includes(type)) r.abort();
                    else r.continue();
                });

                try {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
                } catch {
                    logger.warn(`[puppeteer]: networkidle2 timeout for ${url}, using current DOM`);
                }

                for (const sel of contentSelectors) {
                    const found = await page.waitForSelector(sel, { timeout: 4000 }).catch(() => null);
                    if (found) { logger.info(`[puppeteer]: content ready (${sel}): ${url}`); break; }
                }

                const angularStable = await page.evaluate(() => {
                    return new Promise(resolve => {
                        if (typeof window.getAllAngularTestabilities !== 'function') {
                            resolve(false);
                            return;
                        }
                        const testabilities = window.getAllAngularTestabilities();
                        if (!testabilities || testabilities.length === 0) { resolve(false); return; }
                        let pendingCount = testabilities.length;
                        testabilities.forEach(t => {
                            t.whenStable(() => {
                                pendingCount--;
                                if (pendingCount === 0) resolve(true);
                            });
                        });

                        setTimeout(() => resolve(false), 15000);
                    });
                }).catch(() => false);

                if (angularStable) {
                    logger.info(`[puppeteer]: Angular stable`);
                }

                await page.evaluate(() => new Promise(r => setTimeout(r, 0))).catch(() => null);

                await delay(1200);

                await page.evaluate(async () => {
                    // Smooth scroll through the page in steps to trigger observers
                    const steps = 5;
                    const stepSize = document.body.scrollHeight / steps;
                    for (let i = 1; i <= steps; i++) {
                        window.scrollTo(0, stepSize * i);
                        await new Promise(r => setTimeout(r, 200));
                    }
                }).catch(() => null);

                await delay(800);

                // jQuery $.load / XHR-injected content 
                await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => null);

                const html = await page.content();

                // Sanity check: verify page has meaningful content
                const bodyLen = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length;
                if (bodyLen < 200) {
                    logger.warn(`[puppeteer]: thin content (${bodyLen} chars) for ${url} — may be SPA still loading`);
                } else {
                    logger.info(`[puppeteer]: OK (${bodyLen} chars): ${url}`);
                }

                return html;
            } finally { await browser.close(); }
        };
        return Promise.race([
            task(),
            new Promise((_, r) => setTimeout(() => r(new Error('Puppeteer 120s timeout')), 120000)),
        ]);
    }

    async _zenrowsFetch(url) {
        try {
            const zenrowsMod = require('zenrows');

            const ZenRowsCtor = zenrowsMod.ZenRows
                || zenrowsMod.ZenRowsClient
                || zenrowsMod.default
                || (typeof zenrowsMod === 'function' ? zenrowsMod : null);

            if (typeof ZenRowsCtor !== 'function') {
                logger.warn('[zenrows] Package installed but no constructor found — skipping');
                return null;
            }

            const client = new ZenRowsCtor(ZENROWS_API_KEY);

            const result = await client.get(url, {
                js_render: true,
                antibot: true,
                wait: 3000,
            });

            let html;
            if (result && typeof result.text === 'function') {
                html = await result.text();
            } else if (result && typeof result.data === 'string') {
                html = result.data;
            } else if (typeof result === 'string') {
                html = result;
            }

            if (!html) {
                logger.warn(`[zenrows]: Empty response for ${url}`);
                return null;
            }

            logger.info(`[zenrows]: OK (${html.length} chars): ${url}`);
            return html;
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                logger.warn('[zenrows]: Package not installed — run npm install');
            } else {
                logger.warn(`[zenrows]: ${e.message}`);
            }
            return null;
        }
    }

    async fetchBinary(url) {
        const res = await this.http.get(url, { headers: { 'User-Agent': this.randomUA() } });
        return { data: Buffer.from(res.data), method: 'binary', strategy: 'binary' };
    }

}

module.exports = StrategyFetch;