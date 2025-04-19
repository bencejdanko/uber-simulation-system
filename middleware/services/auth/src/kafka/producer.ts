import { producer } from '../config/kafka'; // Assuming producer instance is exported from kafka config
import config from '../config';

export interface UserRegisteredPayload {
    userId: string;
    userType: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
    email: string;
    // Add other required fields like firstName, lastName, phoneNumber from the original docs
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    timestamp: string; // ISO 8601 format recommended
}

export const publishUserRegistered = async (payload: UserRegisteredPayload): Promise<void> => {
    try {
        await producer.send({
            topic: config.kafka.userRegisteredTopic,
            messages: [
                {
                    key: payload.userId, // Use userId for partitioning
                    value: JSON.stringify(payload),
                },
            ],
        });
        console.log(`Published user registered event for userId: ${payload.userId}`);
    } catch (error) {
        console.error('Failed to publish user registered event:', error);
        // Implement retry logic or dead-letter queue if necessary
        throw error; // Re-throw or handle appropriately
    }
};