// services/customer.service.ts

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: Endpoints for managing customer accounts
 *
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       500:
 *         description: Internal server error
 *
 * /login:
 *   post:
 *     summary: Login as a customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *
 * /customers/{customerId}:
 *   patch:
 *     summary: Update a customer
 *     tags: [Customers]
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *
 * /customers/card/{cardId}:
 *   patch:
 *     summary: Update a payment card
 *     tags: [Customers]
 *     parameters:
 *       - name: cardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Payment card updated successfully
 *       404:
 *         description: Payment card not found
 *
 *   delete:
 *     summary: Delete a payment card
 *     tags: [Customers]
 *     parameters:
 *       - name: cardId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Payment card deleted successfully
 *       404:
 *         description: Payment card not found
 *
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */

import { CustomerModel } from '../models/customer.model';
import { PaymentCardModel } from '../models/paymentCard.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { CustomerInput } from '../types/customer.types';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const updateCustomer = (customerId: string, updates: any) => {
    return CustomerModel.findOneAndUpdate(
        { _id: customerId },
        { ...updates, updatedAt: new Date() },
        { new: true }
    );
};

export const deleteCustomer = (customerId: string) => {
    return CustomerModel.findOneAndDelete({ externalCustomerId: customerId });
};

export const updatePaymentCard = (cardId: string, updates: any) => {
    return PaymentCardModel.findByIdAndUpdate(cardId, updates, { new: true });
};

export const deletePaymentCard = (cardId: string) => {
    return PaymentCardModel.findByIdAndDelete(cardId);
};

export const getCustomerByEmail = (email: string) => {
    return CustomerModel.findOne({ email });
};

export const getCustomerById = (customerId: string) => {
    return CustomerModel.findById(customerId);
}
