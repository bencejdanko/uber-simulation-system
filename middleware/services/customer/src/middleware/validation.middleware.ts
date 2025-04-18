import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Zod schema for customer creation
const customerInputSchema = z.object({
    customerId: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Invalid SSN format"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    address: z.object({
        street: z.string().min(1, "Street is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
    }),
    phoneNumber: z.string().optional(),
    email: z.string().email("Invalid email format"),
    paymentDetails: z.object({
        paymentType: z.enum(["credit", "debit", "wallet", "paypal", "apple_pay", "google_pay"]),
        cardNumber: z.string().min(12, "Card number is required (min 12 digits)"),
        expiryMonth: z.number().int().min(1).max(12),
        expiryYear: z.number().int().min(new Date().getFullYear()),
        cvv: z.string().min(3).max(4),
    }),
});

// Middleware for validating customer input
export const validateCustomerInput = (req: Request, res: Response, next: NextFunction) => {
    const result = customerInputSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "invalid_input",
            message: result.error.errors.map(err => err.message).join(", "),
        });
    }

    next();
};