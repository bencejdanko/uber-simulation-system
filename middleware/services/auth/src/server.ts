// src/server.ts (Simplified Example)
import app from './app'; // Your Express app instance
import config from './config';
import connectDB from './config/db';
import { connectProducer, disconnectProducer } from './config/kafka'; // Import producer lifecycle functions

const startServer = async () => {
    try {
        // 1. Connect to Database
        await connectDB();

        // 2. Connect Kafka Producer
        await connectProducer(); // Ensure producer is connected before starting server

        // 3. Start HTTP Server
        const server = app.listen(config.port, () => {
            console.log(`🚀 Server listening on port ${config.port} in ${config.env} mode`);
        });

        // 4. Graceful Shutdown Handling
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
                // Stop accepting new connections
                server.close(async () => {
                    console.log('HTTP server closed.');
                    // Disconnect Kafka Producer
                    await disconnectProducer();
                    // Disconnect Database (if applicable)
                    // await mongoose.disconnect();
                    // console.log('Database disconnected.');
                    process.exit(0); // Exit gracefully
                });

                // Force shutdown after a timeout if graceful shutdown fails
                setTimeout(() => {
                    console.error('Graceful shutdown timed out. Forcing exit.');
                    process.exit(1);
                }, 10000); // 10 second timeout
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();