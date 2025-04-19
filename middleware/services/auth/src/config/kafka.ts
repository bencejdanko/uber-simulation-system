import { Kafka, Producer, logLevel } from 'kafkajs';
import config from './index'; // Import the main configuration object

// 1. Create the Kafka Client Instance
// This client connects to the Kafka cluster specified in the configuration.
const kafka = new Kafka({
    clientId: config.kafka.clientId, // Identifier for this client instance
    brokers: config.kafka.brokers,   // Array of broker addresses ['host:port', ...]
    // Optional: Add SSL/SASL configuration if your Kafka cluster requires authentication/encryption
    // ssl: true,
    // sasl: { mechanism: 'plain', username: '...', password: '...' },

    // Optional: Configure logging level for kafkajs internal logs
    logLevel: config.env === 'development' ? logLevel.INFO : logLevel.WARN, // Example: More logs in dev

    // Optional: Configure retry mechanism for initial connection etc.
    retry: {
        initialRetryTime: 300, // ms
        retries: 5,
    },
});

// 2. Create the Producer Instance
// The producer is responsible for sending messages to Kafka topics.
const producer: Producer = kafka.producer({
    // Optional Producer Configurations:
    allowAutoTopicCreation: false, // Recommended: disable auto topic creation in production
    idempotent: true, // Recommended: enables exactly-once-semantics for the producer (retries won't cause duplicates)
    retry: { // Configure retries for sending messages
        retries: 5, // Number of retries for sending operations
    },
    // transactionTimeout: 60000 // If using transactions
});

// 3. Connection Function
// Encapsulates the logic to connect the producer to the Kafka cluster.
// Should be called during application startup.
export const connectProducer = async (): Promise<void> => {
    try {
        console.log('Attempting to connect Kafka producer...');
        await producer.connect();
        console.log('✅ Kafka Producer connected successfully.');

        // Optional: Listen to producer events for monitoring
        producer.on('producer.disconnect', (event) => {
            console.warn('Kafka Producer disconnected.', event);
            // Potentially implement reconnection logic or trigger alerts
        });

        producer.on('producer.connect', (event) => {
            console.info('Kafka Producer re-connected (if applicable).', event);
        });

        // Add other event listeners if needed (e.g., 'producer.network.request_timeout')


    } catch (error) {
        console.error('❌ Failed to connect Kafka producer:', error);
        // Depending on how critical Kafka is, you might want to exit the application
        process.exit(1); // Exit if Kafka connection is essential for startup
    }
};

// 4. Disconnection Function
// Encapsulates the logic to disconnect the producer gracefully.
// Should be called during application shutdown.
export const disconnectProducer = async (): Promise<void> => {
    try {
        console.log('Attempting to disconnect Kafka producer...');
        await producer.disconnect();
        console.log('⚪ Kafka Producer disconnected successfully.');
    } catch (error) {
        console.error('❌ Failed to disconnect Kafka producer gracefully:', error);
    }
};

// 5. Export the producer instance and connection functions
// The producer instance will be imported by the service that needs to publish messages.
// The connect/disconnect functions will be used in the main server startup/shutdown logic.
export { producer }; // Export the configured producer instance