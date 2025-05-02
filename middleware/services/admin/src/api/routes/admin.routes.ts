import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// All routes require admin authentication
router.post('/drivers', requireAdmin, adminController.addDriver);
router.post('/customers', requireAdmin, adminController.addCustomer);
router.get('/drivers/:driverId', requireAdmin, adminController.getDriver);
router.get('/customers/:customerId', requireAdmin, adminController.getCustomer);
router.get('/statistics', requireAdmin, adminController.getStatistics);
router.get('/charts', requireAdmin, adminController.getChartData);
router.get('/bills', requireAdmin, adminController.searchBills);
router.get('/bills/:billingId', requireAdmin, adminController.getBill);

export default router;