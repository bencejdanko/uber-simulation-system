import { z } from 'zod';

// Define schema for environment variables for validation
const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: z.string().url(),
    ACCESS_TOKEN_PRIVATE_KEY: z.string(),
    ACCESS_TOKEN_PUBLIC_KEY: z.string(),
    ACCESS_TOKEN_LIFE: z.string().default('60m'),
    ACCESS_TOKEN_KID: z.string(),
    JWT_ISSUER: z.string().url(),
    KAFKA_BROKERS: z.string(),
    KAFKA_CLIENT_ID: z.string().default('auth-service-producer'),
    KAFKA_USER_REGISTERED_TOPIC: z.string().default('user.registered'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
});

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables.");
}

const env = parsedEnv.data;

// Export typed config object
const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    mongo: {
        uri: env.MONGODB_URI,
    },
    jwt: {
        accessTokenPrivateKey: env.ACCESS_TOKEN_PRIVATE_KEY,
        accessTokenPublicKey: env.ACCESS_TOKEN_PUBLIC_KEY,
        accessTokenLife: env.ACCESS_TOKEN_LIFE,
        accessTokenKid: env.ACCESS_TOKEN_KID,
        issuer: env.JWT_ISSUER,
        algorithms: ['RS256'] as const, // Explicitly set algorithm for access token
    },
    kafka: {
        brokers: env.KAFKA_BROKERS.split(','), // Allow comma-separated list
        clientId: env.KAFKA_CLIENT_ID,
        userRegisteredTopic: env.KAFKA_USER_REGISTERED_TOPIC,
    },
    bcrypt: {
        saltRounds: env.BCRYPT_SALT_ROUNDS,
    },
} as const; // Use 'as const' for stronger type inference

export type AppConfig = typeof config;
export default config;