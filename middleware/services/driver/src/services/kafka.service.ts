import { Kafka, Producer, Consumer } from 'kafkajs';

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
        await this.producer.connect();
        await this.consumer.connect();
    }

    async disconnect() {
        await this.producer.disconnect();
        await this.consumer.disconnect();
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