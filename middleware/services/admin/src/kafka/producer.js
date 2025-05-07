const { Kafka } = require('kafkajs');

// Kafka Setup
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: process.env.KAFKA_BROKERS.split(','),
});

const producer = kafka.producer();
let kafkaConnected = false;

// Connect the Kafka producer
async function connectProducer() {
  try {
    await producer.connect();
    kafkaConnected = true;
    console.log('✅ Kafka Producer connected');
  } catch (error) {
    kafkaConnected = false;
    console.error('❌ Kafka not available, continuing without it:', error.message);
  }
}

async function disconnectProducer() {
  if (kafkaConnected) {
    await producer.disconnect();
    kafkaConnected = false;
    console.log('🛑 Kafka Producer disconnected');
  }
}

// Send Event Functions
async function sendDriverCreated(payload) {
  if (!kafkaConnected) {
    console.warn('⚠️ Kafka not connected — skipping driver event');
    return;
  }

  console.log('Kafka Produced Event: driver.profile.created', payload);
  try {
    await producer.send({
      topic: 'driver.profile.created',
      messages: [{ value: JSON.stringify(payload) }],
    });
  } catch (error) {
    console.error('❌ Failed to send driver event:', error);
  }
}

async function sendCustomerCreated(payload) {
  if (!kafkaConnected) {
    console.warn('⚠️ Kafka not connected — skipping customer event');
    return;
  }

  console.log('Kafka Produced Event: customer.profile.created', payload);
  try {
    await producer.send({
      topic: 'customer.profile.created',
      messages: [{ value: JSON.stringify(payload) }],
    });
  } catch (error) {
    console.error('❌ Failed to send customer event:', error);
  }
}

// Connect the producer at app startup
(async () => {
  if (process.env.NODE_ENV !== 'test') {
    await connectProducer();
  }
})();

// Export the functions for use in other files
module.exports = {
  sendDriverCreated,
  sendCustomerCreated,
  connectProducer,
  disconnectProducer,
};
