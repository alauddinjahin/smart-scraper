'use strict';

const { NODE_ENV, PORT } = require('./shared/config/env');
require('dotenv').config({
    path: NODE_ENV === 'test' ? '.env.test' : '.env',
});

const createApp = require('./app');
const logger = require('./shared/config/logger');

async function initializeDependencies() {

    return {};
}

async function startServer() {

    try {
        // --- Initialize dependencies ------------------------------------------
        const dependencies = await initializeDependencies();
        // --- Create Express app -----------------------------------------------
        const app = createApp(dependencies);

        const server = app.listen(PORT, () => {
            console.info(`Server running on :${PORT} [${ NODE_ENV || 'development'}]`);
        });


        // --- Graceful shutdown -------------------------------------------------
        const shutdown = async (signal) => {
            logger.info(`[server] ${signal} received — shutting down gracefully`);
            server.close(() => {
                logger.info('[server] HTTP server closed');
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 10_000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });

        process.exit(1);
    }



}


if (require.main === module) {
    startServer();
}

module.exports = { startServer, initializeDependencies };




