import { Kafka, Producer, Consumer, ConsumerConfig, ProducerConfig } from 'kafkajs';
import config from './config';

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
    console.log('Producer connected to Kafka');
    return producer;
  } catch (error) {
    console.log({ error }, 'Failed to connect producer to Kafka');
    throw error;
  }
}


// Above pulled from middleware/libs/src/kafka/client.ts
let producer: Awaited<ReturnType<typeof createProducer>>;

export async function getKafkaProducer() {
  if (!producer) {
    producer = await createProducer();
  }
  return producer;
}
