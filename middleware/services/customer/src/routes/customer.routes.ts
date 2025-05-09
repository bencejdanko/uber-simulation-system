// routes/customer.routes.ts
import { Router } from 'express';
import * as CustomerController from '../controller/customerController';

const router = Router();

// router.post('/', validateCustomerInput, CustomerController.createCustomer);
// router.post('/login', CustomerController.login);
// router.get('/verify', CustomerController.verifyEmail);
// router.post('/reset-password-request', CustomerController.requestPasswordReset);
// router.post('/reset-password', CustomerController.resetPassword);

router.patch('/:customerId', CustomerController.updateCustomer);
router.delete('/:customerId', CustomerController.deleteCustomer);

router.patch('/card/:cardId', CustomerController.updatePaymentCard);
router.delete('/card/:cardId', CustomerController.deletePaymentCard);

export default router;