// controllers/customer.controller.ts
import { Request, Response } from 'express';
import * as CustomerService from '../services/customer.service';
import { CustomerInput, ResetPasswordInput } from '../types/customer.types';

export const getCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await CustomerService.getCustomerById(req.params.customerId);
        if (!customer) return res.status(404).json({ error: 'customer_not_found' });
        res.status(200).json(customer);
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