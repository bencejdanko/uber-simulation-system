import { Kafka, Producer, Consumer } from 'kafkajs';
import logger from '../config/logger'; // Import logger

class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;

    constructor(brokerList: string[]) {
        this.kafka = new Kafka({
            clientId: 'driver-service',
            brokers: brokerList,
        });

        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: 'driver-group' });
    }

    async connect() {
        try {
            logger.info('Connecting Kafka producer...');
            await this.producer.connect();
            logger.info('✅ Kafka producer connected.');

            logger.info('Connecting Kafka consumer...');
            await this.consumer.connect();
            logger.info('✅ Kafka consumer connected.');
        } catch (error) {
            logger.error('❌ Failed to connect Kafka producer or consumer:', error);
            throw error; // Re-throw error to prevent server starting if Kafka fails
        }
    }

    async disconnect() {
        try {
            logger.info('Disconnecting Kafka producer...');
            await this.producer.disconnect();
            logger.info('Kafka producer disconnected.');

            logger.info('Disconnecting Kafka consumer...');
            await this.consumer.disconnect();
            logger.info('Kafka consumer disconnected.');
        } catch (error) {
            logger.error('Failed to disconnect Kafka producer or consumer:', error);
        }
    }

    async sendMessage(topic: string, message: any) {
        await this.producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message) },
            ],
        });
    }

    async subscribeToTopic(topic: string, callback: (message: any) => void) {
        await this.consumer.subscribe({ topic, fromBeginning: true });
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const parsedMessage = JSON.parse(message.value?.toString() || '{}');
                callback(parsedMessage);
            },
        });
    }
}

export default KafkaService;