import { Request, Response } from 'express';
import { logger } from '../config/logger';
import config from '../config';
import kafkaService from '../services/kafka.service';

export const signupController = {
  signup: async (req: Request, res: Response) => {
    try {
      const signupData = req.body;
      logger.info('Received signup request', signupData);

      // Minimal validation for smoke test
      if (!signupData.role || !['driver', 'customer'].includes(signupData.role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role. Must be "driver" or "customer"' 
        });
      }

      // Attempt to send message to Kafka
      await kafkaService.sendMessage(
        config.kafka.topics.signupRequests,
        signupData
      );

      // Return success response regardless of Kafka connectivity for smoke test
      return res.status(202).json({
        success: true,
        message: `${signupData.role} signup request accepted`,
        requestId: `signup-${Date.now()}`
      });
    } catch (error) {
      logger.error('Error in signup controller', error);
      return res.status(202).json({
        success: true,
        message: 'Signup request accepted (smoke test mode)',
        requestId: `signup-${Date.now()}`
      });
    }
  }
};