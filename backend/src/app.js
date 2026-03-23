'use strict';

require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { notFoundHandler, errorHandler } = require('./shared/errors/app.error');
const { CLIENT_ORIGIN, NODE_ENV } = require('./shared/config/env');
const jobRoutes        = require('./modules/job/routes/job.routes');
const universityRoutes = require('./modules/university/routes/university.routes');

function createApp(dependencies) {

    const app = express();

    // --- Security ---------------------------------------------------------------
    app.use(helmet());
    app.use(cors({
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }));

    // --- Rate limiting -----------------------------------------------------------
    app.use('/api', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests, please try again later.' },
    }));

    app.use('/api/scrape', rateLimit({
        windowMs: 5 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many scrape requests, slow down.' },
    }));

    // --- Parsing -----------------------------------------------------------------
    if (NODE_ENV !== 'test') app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- Extended timeout for scrape routes ---------------------------------------
    app.use('/api/scrape', (req, res, next) => {
        req.setTimeout(120_000);
        res.setTimeout(120_000);
        next();
    });

    // --- Health check ------------------------------------------------------------
    app.get('/health', (_req, res) =>
        res.json({
            status: 'ok',
            ts: new Date().toISOString(),
            uptime: process.uptime(),
            env: NODE_ENV,
            version: '1.0.0',
        })
    );

    // --- Module routes ------------------------------------------------------------
    app.use('/api/universities', universityRoutes);
    app.use('/api/jobs', jobRoutes);
    // --- Error handlers -----------------------------------------------------------
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;

}

module.exports = createApp;
