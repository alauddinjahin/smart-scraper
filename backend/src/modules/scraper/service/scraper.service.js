'use strict';

const prisma         = require('../../../infrastructure/database/prisma.client');
const engine         = require('../engine/scraper.engine');
const logger         = require('../../../shared/config/logger');

const DEFAULT_ACCURACY_THRESHOLD = 50; // minimum % to consider scrape successful
const DEFAULT_MAX_ATTEMPTS       = 3;
const INTER_RETRY_DELAY_MS       = 3000;
const INTER_UNIVERSITY_DELAY_MS  = 2000;

class ScraperService {

}

module.exports = new ScraperService();