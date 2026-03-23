'use strict';
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

const env = {
  NODE_ENV:        process.env.NODE_ENV        || 'development',
  PORT:            parseInt(process.env.PORT)  || 4000,
  DATABASE_URL:    process.env.DATABASE_URL,
  CLIENT_ORIGIN:   process.env.CLIENT_ORIGIN  || 'http://localhost:3000',
  OPENAI_API_KEY:  process.env.OPENAI_API_KEY  || null,
  ZENROWS_API_KEY: process.env.ZENROWS_API_KEY || null,
  LOG_LEVEL:       process.env.LOG_LEVEL       || 'info',
  isProduction:    process.env.NODE_ENV === 'production',
  isTest:          process.env.NODE_ENV === 'test',
  isDevelopment:   process.env.NODE_ENV === 'development',
};

module.exports = env;
