// src/app.ts
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import customerRoutes from './routes/customer.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Swagger Setup
const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Boom Rides Customer Service API',
            version: '1.0.0'
        },
        servers: [{ url: 'http://localhost:5000' }]
    },
    apis: ['./src/**/*.ts']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/customers', customerRoutes);

// Health check
app.get('/', (_req, res) => res.send('Customer Service is running 🚀'));

export default app;
