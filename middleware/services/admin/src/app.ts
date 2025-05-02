import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './api/routes/admin.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/admin', adminRoutes);

export default app;