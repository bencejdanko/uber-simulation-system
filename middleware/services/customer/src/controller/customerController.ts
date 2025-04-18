// controllers/customer.controller.ts
import { Request, Response } from 'express';
import * as CustomerService from '../services/customer.service';
import jwt from 'jsonwebtoken';
import { CustomerInput, ResetPasswordInput } from '../types/customer.types';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const createCustomer = async (req: Request<{}, {}, CustomerInput>, res: Response) => {
    try {
        const { customer, verifyToken } = await CustomerService.createCustomer(req.body);
        res.status(201).json({ message: 'Customer created', verifyToken });
    } catch (err) {
        res.status(500).json({ error: 'internal_error', message: (err as Error).message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await CustomerService.updateCustomer(req.params.customerId, req.body);
        if (!customer) return res.status(404).json({ error: 'customer_not_found' });
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: 'internal_error', message: (err as Error).message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await CustomerService.deleteCustomer(req.params.customerId);
        if (!customer) return res.status(404).json({ error: 'customer_not_found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'internal_error', message: (err as Error).message });
    }
};

export const updatePaymentCard = async (req: Request, res: Response) => {
    try {
        const card = await CustomerService.updatePaymentCard(req.params.cardId, req.body);
        if (!card) return res.status(404).json({ error: 'card_not_found' });
        res.status(200).json(card);
    } catch (err) {
        res.status(500).json({ error: 'internal_error', message: (err as Error).message });
    }
};

export const deletePaymentCard = async (req: Request, res: Response) => {
    try {
        const result = await CustomerService.deletePaymentCard(req.params.cardId);
        if (!result) return res.status(404).json({ error: 'card_not_found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'internal_error', message: (err as Error).message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const token = await CustomerService.loginCustomer(req.body.email, req.body.password);
        if (!token) return res.status(401).json({ error: 'Invalid credentials' });
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ error: 'internal_error', message: (err as Error).message });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        const payload = jwt.verify(token as string, JWT_SECRET);
        await CustomerService.verifyEmail((payload as any).id);
        res.status(200).send('Email verified.');
    } catch {
        res.status(400).send('Invalid or expired token.');
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const customer = await CustomerService.getCustomerByEmail(req.body.email);
        if (!customer) return res.status(404).json({ error: 'email_not_found' });
        const resetToken = CustomerService.generatePasswordResetToken(customer.externalCustomerId);
        res.status(200).json({ message: 'Reset email sent', resetToken });
    } catch (err) {
        res.status(500).json({ error: 'internal_error', message: (err as Error).message });
    }
};

export const resetPassword = async (req: Request<{}, {}, ResetPasswordInput>, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        const payload = jwt.verify(token, JWT_SECRET) as any;
        await CustomerService.resetPassword(payload.id, newPassword);
        res.status(200).send('Password reset successful.');
    } catch {
        res.status(400).send('Invalid or expired token.');
    }
};