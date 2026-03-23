'use strict';

const { PrismaClient } = require('@prisma/client');
const { NODE_ENV } = require('../../shared/config/env');

const g = globalThis;

const prisma = g.__prisma ?? new PrismaClient({
  log: NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['error'],

  transactionOptions: {
    maxWait: 10_000,   // ms to wait for a connection slot
    timeout: 10_000,   // ms the transaction body can run
  },
});

if (NODE_ENV !== 'production') g.__prisma = prisma;

module.exports = prisma;
