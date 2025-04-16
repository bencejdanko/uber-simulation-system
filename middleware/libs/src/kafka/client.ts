import { Kafka, Producer, Consumer, ConsumerConfig, ProducerConfig } from 'kafkajs';
import config from '../config';
import logger from '../config/logger';

export const TOPICS = {
  SIGNUP_REQUESTS: 'signup_requests',
  DRIVER_LOCATION_UPDATES: 'driver_location_updates',
  RIDE_REQUESTS: 'ride_requests',
  RIDE_COMPLETED: 'ride_completed',
};

// Create and configure Kafka client
const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

// Create a producer with optional custom configuration
export async function createProducer(customConfig?: ProducerConfig): Promise<Producer> {
  const producer = kafka.producer(customConfig);
  
  try {
    await producer.connect();
    logger.info('Producer connected to Kafka');
    return producer;
  } catch (error) {
    logger.error({ error }, 'Failed to connect producer to Kafka');
    throw error;
  }
}

// Create a consumer with a specified group ID and optional custom configuration
export async function createConsumer(groupId: string, customConfig?: ConsumerConfig): Promise<Consumer> {
  const consumer = kafka.consumer({
    groupId,
    ...(customConfig || {}),
  });
  
  try {
    await consumer.connect();
    logger.info({ groupId }, 'Consumer connected to Kafka');
    return consumer;
  } catch (error) {
    logger.error({ error, groupId }, 'Failed to connect consumer to Kafka');
    throw error;
  }
}

// Utility function to create topics if they don't exist yet
export async function createTopicsIfNeeded(topics: string[]): Promise<void> {
  const admin = kafka.admin();
  
  try {
    await admin.connect();
    const existingTopics = await admin.listTopics();
    
    const topicsToCreate = topics.filter((topic) => !existingTopics.includes(topic));
    
    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate.map((topic) => ({
          topic,
          numPartitions: 3, // Default to 3 partitions
          replicationFactor: 1, // Default to 1 replica for local dev
        })),
      });
      logger.info({ topicsCreated: topicsToCreate }, 'Created Kafka topics');
    }
    
    await admin.disconnect();
  } catch (error) {
    logger.error({ error }, 'Error creating Kafka topics');
    await admin.disconnect();
    throw error;
  }
}