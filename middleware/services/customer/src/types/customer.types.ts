// types/customer.types.ts

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export type PaymentType = 'credit' | 'debit' | 'wallet' | 'paypal' | 'apple_pay' | 'google_pay';

export interface PaymentDetails {
    cardNumber: string;
    paymentType: PaymentType;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    cardType: string;
}

export interface CustomerInput {
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    address: Address;
    paymentDetails: PaymentDetails;
}

export interface ResetPasswordInput {
    token: string;
    newPassword: string;
}