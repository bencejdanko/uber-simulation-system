import { z } from 'zod';

export const RegisterCustomerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8), // Add complexity rules if needed
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().optional(), // Example: make optional
    }),
});

export const RegisterDriverSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8), // Add complexity rules if needed
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().optional(), // Example: make optional
    }),
});

// Define similar Zod schemas for RegisterDriver, Login, Refresh
export const LoginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

export const RefreshSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});

// Define types inferred from schemas for controller usage
export type RegisterCustomerInput = z.infer<typeof RegisterCustomerSchema>['body'];
export type RegisterDriverInput = z.infer<typeof RegisterDriverSchema>['body'];
export type LoginInput = z.infer<typeof LoginSchema>['body'];
export type RefreshInput = z.infer<typeof RefreshSchema>['body'];