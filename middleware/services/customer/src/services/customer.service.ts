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

export const createCustomer = async (data: CustomerInput) => {
    const { customerId, firstName, lastName, email, password, phoneNumber, address, paymentDetails } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const tokenizedId = uuidv4();
    const last4Digits = paymentDetails.cardNumber.slice(-4);

    const paymentCard = await PaymentCardModel.create({
        customerId,
        paymentType: paymentDetails.paymentType,
        last4Digits,
        cardType: paymentDetails.cardType,
        expiryMonth: paymentDetails.expiryMonth,
        expiryYear: paymentDetails.expiryYear,
        tokenizedId
    });

    const customer = await CustomerModel.create({
        externalCustomerId: customerId,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phoneNumber,
        address,
        paymentCardId: paymentCard._id,
        verified: false
    });

    const token = jwt.sign({ id: customer.externalCustomerId }, JWT_SECRET, { expiresIn: '1d' });
    return { customer, verifyToken: token };
};

export const updateCustomer = (customerId: string, updates: any) => {
    return CustomerModel.findOneAndUpdate(
        { externalCustomerId: customerId },
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

export const loginCustomer = async (email: string, password: string) => {
    const customer = await CustomerModel.findOne({ email }).select('+password');
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
        return null;
    }
    const token = jwt.sign({ id: customer.externalCustomerId, role: customer.role }, JWT_SECRET, { expiresIn: '1d' });
    return token;
};

export const verifyEmail = (customerId: string) => {
    return CustomerModel.findOneAndUpdate({ externalCustomerId: customerId }, { verified: true });
};

export const generatePasswordResetToken = (customerId: string) => {
    return jwt.sign({ id: customerId }, JWT_SECRET, { expiresIn: '15m' });
};

export const resetPassword = async (customerId: string, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return CustomerModel.findOneAndUpdate({ externalCustomerId: customerId }, { password: hashedPassword });
};

export const getCustomerByEmail = (email: string) => {
    return CustomerModel.findOne({ email });
};