'use strict';

require('dotenv').config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});
const { NODE_ENV, PORT } = require('./shared/config/env');

const createApp = require('./app');
const logger = require('./shared/config/logger');

async function initializeDependencies() {
    return {};
}

async function bootstrap() {
    const deps = await initializeDependencies();
    const app = createApp(deps);
    return app;
}

async function startServer() {

    try {
        // --- Create Express app -----------------------------------------------
        const app = await bootstrap();

        if (!PORT) {
            throw new Error('PORT is not defined');
        }

        const server = app.listen(PORT, () => {
            console.info(`Server running on :${PORT} [${ NODE_ENV || 'development'}]`);
        });


        // --- Graceful shutdown -------------------------------------------------
        const shutdown = async (signal) => {
            logger.info(`[server]: ${signal} received — shutting down gracefully`);

            const forceExit = setTimeout(() => {
                logger.error('[server]: Force shutdown after timeout');
                process.exit(1);
            }, 10_000);

            try {
                await new Promise((resolve, reject) => {
                    server.close((err) => {
                        if (err) return reject(err);
                        logger.info('[server]: HTTP server closed');
                        resolve();
                    });
                });

                clearTimeout(forceExit);
                process.exit(0);

            } catch (err) {
                logger.error('[server]: shutdown error', { error: err.message });
                process.exit(1);
            }
        };


        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        process.on('unhandledRejection', (err) => {
            logger.error('[process]: Unhandled Rejection', { error: err.message });
            process.exit(1);
        });

        process.on('uncaughtException', (err) => {
            logger.error('[process]: Uncaught Exception', { error: err.message });
            process.exit(1);
        });


    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
        });

        process.exit(1);
    }



}


if (require.main === module) {
    startServer();
}

module.exports = { startServer, initializeDependencies };




