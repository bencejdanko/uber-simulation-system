import bcrypt from 'bcryptjs';
import config from '../config';

export const hashPassword = async (plainPassword: string): Promise<string> => {
    return bcrypt.hash(plainPassword, config.bcrypt.saltRounds);
};

export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};