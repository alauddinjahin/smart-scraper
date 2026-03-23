'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[process.env.LOG_LEVEL ?? 'info'] ?? LEVELS.info;
const ts = () => new Date().toISOString();
const pad = s => s.padEnd(5);

const logger = {
  error: (msg, ...a) => current >= 0 && console.error(`[${ts()}] ${pad('ERROR')} ${msg}`, ...a),
  warn:  (msg, ...a) => current >= 1 && console.warn (`[${ts()}] ${pad('WARN')}  ${msg}`, ...a),
  info:  (msg, ...a) => current >= 2 && console.info (`[${ts()}] ${pad('INFO')}  ${msg}`, ...a),
  debug: (msg, ...a) => current >= 3 && console.debug(`[${ts()}] ${pad('DEBUG')} ${msg}`, ...a),
};

module.exports = logger;
