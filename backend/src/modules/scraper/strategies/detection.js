const logger = require('../../../shared/config/logger');
const prisma = require('../../../infrastructure/database/prisma.client');
const cheerio = require('cheerio');
const { jsSignals } = require('../utils/constants');
const { ZENROWS_API_KEY } = require('../../../shared/config/env');
const BaseStrategy = require('./base');

class StrategyDetection extends BaseStrategy {
    constructor(ctx) {
        super(ctx); 
    }

    async loadConfig(universityId) {
        try {
        const record = await prisma.universityScrapeConfig.findUnique({ where: { universityId } });
        return record?.config || null;
        } catch { return null; }
    }

    async resolveStrategy(url, universityId) {
        if (url.includes('/#/') || url.includes('#!')) {
            logger.info(`[strategy]: Hash-route URL detected → puppeteer: ${url}`);
            if (universityId) await this.saveStrategy(universityId, 'puppeteer').catch(() => { });
            return 'puppeteer';
        }

        if (universityId) {
            const config = await this.loadConfig(universityId);
            if (config?.strategy && config.strategy !== 'auto') {
                logger.info(`[strategy] DB config: ${config.strategy} for ${url}`);
                return config.strategy;
            }
        }
        const strategy = await this._detectStrategy(url);
        if (universityId) await this.saveStrategy(universityId, strategy).catch(() => { });
        return strategy;
    }

    async _detectStrategy(url) {
        logger.info(`[strategy] Probing: ${url}`);
        try {
            const probe = await this.http.get(url, {
                timeout: 8000,
                headers: { 'User-Agent': this.randomUA() },
                responseType: 'arraybuffer',
                maxRedirects: 3,
                validateStatus: s => s < 600,
            });
            const status = probe.status;
            const html = Buffer.from(probe.data).toString('utf-8');

            if (status === 403 || status === 503) {
                logger.info(`[strategy] ${url} → ${status} → zenrows/puppeteer`);
                return ZENROWS_API_KEY ? 'zenrows' : 'puppeteer';
            }

            const $ = cheerio.load(html);
            const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

            // JS-render signals 
            const hasJsSignal = jsSignals.some(sig => html.includes(sig));

            const mainText = $('main, [role="main"], #main, #content, .content, article').text()
                .replace(/\s+/g, ' ').trim();

            const contentThin = mainText.length < 100 && bodyText.length < 500;
            const isJsRendered = hasJsSignal || contentThin || (!bodyText || bodyText.length < 200);

            if (isJsRendered) { logger.info(`[strategy]: ${url} → puppeteer (JS signals: ${hasJsSignal}, thin: ${contentThin})`); return 'puppeteer'; }
            logger.info(`[strategy]: ${url} → axios (bodyText: ${bodyText.length} chars)`);
            return 'axios';
        } catch (e) {
            const s = e.response?.status;
            if (s === 403 || s === 429) return ZENROWS_API_KEY ? 'zenrows' : 'puppeteer';
            logger.warn(`[strategy]: probe failed: ${e.message} → puppeteer`);
            return 'puppeteer';
        }
    }

    async saveStrategy(universityId, strategy, conf=null) {
        try {

            let config = conf;
            if(!conf){
                const existingConfig = await this.loadConfig(universityId);
                config = { ...(existingConfig || {}), strategy, detectedAt: new Date().toISOString() };
            }
            
            await prisma.universityScrapeConfig.upsert({
                where: { universityId },
                update: { config },
                create: { universityId, config },
            });
        } catch (e) {
            logger.warn(`[strategy]: Failed to save strategy for ${universityId}: ${e.message}`);
        }
    }

}

module.exports = StrategyDetection;