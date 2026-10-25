import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './db/database.js';
import { startExpirationWorker } from './services/expirationWorker.js';

async function startServer() {
    await connectDB();

    // Start background expiration worker (runs every 60s)
    startExpirationWorker(60000);

    const server = app.listen(config.port, () => {
        console.log(`🎬 CineMoments API Server running on port ${config.port} (${config.nodeEnv})`);
        console.log(`📡 URL: http://localhost:${config.port}`);
    });

    process.on('SIGTERM', () => {
        console.log('SIGTERM received, closing HTTP server and database...');
        server.close(async () => {
            await mongoose.connection.close();
            console.log('Server terminated gracefully.');
        });
    });
}

startServer();
