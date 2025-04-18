// routes/customer.routes.ts
import { Router } from 'express';
import * as CustomerController from '../controller/customerController';
import { authenticate } from '../middleware/auth.middleware';
import { validateCustomerInput } from '../middleware/validation.middleware';

const router = Router();

router.post('/', validateCustomerInput, CustomerController.createCustomer);
router.post('/login', CustomerController.login);
router.get('/verify', CustomerController.verifyEmail);
router.post('/reset-password-request', CustomerController.requestPasswordReset);
router.post('/reset-password', CustomerController.resetPassword);

router.patch('/:customerId', authenticate, CustomerController.updateCustomer);
router.delete('/:customerId', authenticate, CustomerController.deleteCustomer);

router.patch('/card/:cardId', authenticate, CustomerController.updatePaymentCard);
router.delete('/card/:cardId', authenticate, CustomerController.deletePaymentCard);

export default router;