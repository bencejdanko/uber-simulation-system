import { Request, Response, NextFunction } from 'express';
import * as PasswordService from '../../services/password.service';
import * as TokenService from '../../services/token.service';
import { AuthModel } from '../../models/auth.model';
import { CustomerModel } from '../../models/customer.model';
import { DriverModel } from '../../models/driver.model';
// import { publishUserRegistered, UserRegisteredPayload } from '../../kafka/producer';
import { RegisterCustomerInput, RegisterDriverInput, LoginInput } from '../../schemas/auth.schemas';

// Helper function to generate SSN-like unique IDs
function generateSsnLikeId(): string {
    // Generate random numbers for each segment of SSN-like format (XXX-XX-XXXX)
    const part1 = String(Math.floor(Math.random() * 900) + 100); // 100-999
    const part2 = String(Math.floor(Math.random() * 90) + 10);   // 10-99
    const part3 = String(Math.floor(Math.random() * 9000) + 1000); // 1000-9999
    
    return `${part1}-${part2}-${part3}`;
}

export const registerCustomer = async (req: Request<{}, {}, RegisterCustomerInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password, firstName, lastName, phoneNumber } = req.body;

        // 1. Check if user exists
        const existingUser = await AuthModel.findOne({ email });
        if (existingUser) {

            // check if roles doesn't contain 'CUSTOMER'
            if (existingUser.userType === 'CUSTOMER') {
                res.status(409).json({ error: { code: 'USER_ALREADY_EXISTS', message: 'Email already in use.' } });
                return;
            }
            // If user exists but is not a customer, we can proceed to register them as a customer
            
            res.status(409).json({ error: { code: 'USER_ALREADY_EXISTS', message: 'Email already in use.' } });

            return;
        }

        // 2. Hash password (using PasswordService)
        const hashedPassword = await PasswordService.hashPassword(password);

        // 3. Create user in AuthModel (now with generated userId)
        const newUser = await AuthModel.create({
            userId: generateSsnLikeId(), // Generate SSN-like ID for the user
            email,
            hashedPassword,
            userType: 'CUSTOMER',
        });

        // 3.5 Create corresponding Customer entry
        await CustomerModel.create({
            _id: newUser.userId, // Link to the AuthModel entry
            firstName,
            lastName,
            email, // Store email here too for potential direct queries
            phoneNumber,
            // Add other customer-specific fields if needed
        });

        // 4. Generate token (simplified - no refresh token)
        const accessToken = TokenService.generateAccessToken({ userId: newUser.userId, userType: newUser.userType });

        // 5. Publish event (Commented out)
        /*
        const eventPayload: UserRegisteredPayload = {
            userId: newUser.userId,
            userType: newUser.userType,
            email: newUser.email,
            firstName,
            lastName,
            phoneNumber,
            timestamp: new Date().toISOString(),
        };
        publishUserRegistered(eventPayload).catch(err => {
            console.error("Failed to publish registration event asynchronously:", err);
            // Potentially add to a retry queue or log for monitoring
        });
        */

        // 6. Return response
        res.status(201).json({ accessToken });

    } catch (error) {
        next(error); // Pass to global error handler
    }
};

export const registerDriver = async (req: Request<{}, {}, RegisterDriverInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password, firstName, lastName, phoneNumber /* Add licenseNumber, vehicleInfo if needed */ } = req.body;

        // 1. Check if user exists
        const existingUser = await AuthModel.findOne({ email });
        if (existingUser) {
            res.status(409).json({ error: { code: 'USER_ALREADY_EXISTS', message: 'Email already in use.' } });
            return;
        }

        // 2. Hash password (using PasswordService)
        const hashedPassword = await PasswordService.hashPassword(password);

        // 3. Create user in AuthModel (now with generated userId)
        const newUser = await AuthModel.create({
            userId: generateSsnLikeId(), // Generate SSN-like ID for the user
            email,
            hashedPassword,
            userType: 'DRIVER',
        });

        console.log(`New user created: ${JSON.stringify(newUser)}`);

        // 3.5 Create corresponding Driver entry
        await DriverModel.create({
            _id: newUser.userId, // Link to the AuthModel entry
            firstName,
            lastName,
            email, // Store email here too
            phoneNumber,
            // Add driver-specific fields like licenseNumber, vehicleInfo, etc.
            // licenseNumber: req.body.licenseNumber,
            // vehicleInfo: req.body.vehicleInfo,
        });

        // 4. Generate token (simplified - no refresh token)
        const accessToken = TokenService.generateAccessToken({ userId: newUser.userId, userType: newUser.userType });

        // 5. Publish event (Commented out)
        /*
        const eventPayload: UserRegisteredPayload = {
            userId: newUser.userId,
            userType: newUser.userType,
            email: newUser.email,
            firstName,
            lastName,
            phoneNumber,
            // Add driver-specific fields
            // licenseNumber,
            // vehicleInfo,
            timestamp: new Date().toISOString(),
        };
        publishUserRegistered(eventPayload).catch(err => {
            console.error("Failed to publish registration event asynchronously:", err);
            // Potentially add to a retry queue or log for monitoring
        });
        */

        // 6. Return response
        res.status(201).json({ accessToken });

    } catch (error) {
        next(error); // Pass to global error handler
    }
};

export const login = async (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await AuthModel.findOne({ email });
        if (!user) {
            res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
            return;
        }
        
        // Validate password
        const isPasswordValid = await PasswordService.comparePassword(password, user.hashedPassword);
        if (!isPasswordValid) {
            res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
            return;
        }

        // Generate token (simplified - no refresh token)
        const accessToken = TokenService.generateAccessToken({ userId: user.userId, userType: user.userType });
        
        res.status(200).json({ accessToken });

    } catch (error) {
        next(error);
    }
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Default admin credentials
    const DEFAULT_ADMIN_EMAIL = 'admin@uber.com';
    const DEFAULT_ADMIN_PASSWORD = 'admin123';
    
    // Check if using default admin credentials
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      // Generate token for admin
      const token = TokenService.generateAccessToken({ 
        userId: 'admin-1', 
        userType: 'ADMIN' 
      });
      
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: 'admin-1',
            email: DEFAULT_ADMIN_EMAIL,
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User'
          },
          token
        }
      });
    }
    
    // If not default admin credentials, return error
    return res.status(401).json({
      success: false,
      error: 'Invalid admin credentials'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin login failed'
    });
  }
};