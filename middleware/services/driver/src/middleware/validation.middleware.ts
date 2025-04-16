import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Define ZOD schemas for validation
const driverInputSchema = z.object({
  driverId: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Invalid SSN format"),
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
  carDetails: z.object({
    make: z.string().min(1, "Car make is required"),
    model: z.string().min(1, "Car model is required"),
    year: z.number().int().min(1886, "Invalid car year"),
    color: z.string().optional(),
    licensePlate: z.string().optional(),
  }),
  introduction: z.object({
    imageUrl: z.string().url("Invalid image URL").optional(),
    videoUrl: z.string().url("Invalid video URL").optional(),
  }).optional(),
});

// Middleware for validating driver input
export const validateDriverInput = (req: Request, res: Response, next: NextFunction) => {
  const result = driverInputSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: "invalid_input",
      message: result.error.errors.map(err => err.message).join(", "),
    });
  }
  
  next();
};

// Additional validation middleware can be added here for other endpoints as needed.