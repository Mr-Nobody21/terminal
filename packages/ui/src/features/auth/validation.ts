import { z } from 'zod';
import domains from './data/disposable-domains.json';
const disposableDomains = new Set(domains);
export type AuthField = 'email' | 'password' | 'displayName' | 'otp';
export type AuthErrors = Partial<Record<AuthField, string>>;
const commonPasswords = new Set(['password1234','password12345','password123456','password123!','qwerty123456','qwertyuiop12','123456789012','1234567890123','12345678901234','123456789012345','1234567890123456','letmein123456','welcome12345','welcome123456','changeme12345','admin1234567']);
export function disposableEmail(email: string) {
    const parts = email.trim().toLowerCase().split('@').at(-1)!.split('.');
    return parts.some((_, index) => index < parts.length - 1 && disposableDomains.has(parts.slice(index).join('.')));
}
export function validateCredentials(values: { email: string; password: string; displayName?: string }, registration: boolean): AuthErrors {
    const errors: AuthErrors = {}, email = values.email.trim().toLowerCase();
    if (!email) errors.email = 'Enter your email address.';
    else if (email.length > 254 || !z.email().safeParse(email).success) errors.email = 'Enter a valid email address, such as name@example.com.';
    else if (registration && disposableEmail(email)) errors.email = 'Temporary email addresses are not supported. Use a permanent email address.';
    if (!values.password) errors.password = 'Enter your password.';
    else if (values.password.length < 12) errors.password = 'Use at least 12 characters for your password.';
    else if (values.password.length > 128) errors.password = 'Use no more than 128 characters for your password.';
    else if (registration && (!values.password.trim() || /^(.)\1+$/us.test(values.password) || commonPasswords.has(values.password.trim().toLowerCase()))) errors.password = 'This password is too common or repetitive. Choose a unique passphrase.';
    if (registration && !values.displayName?.trim()) errors.displayName = 'Enter your name.';
    else if (registration && values.displayName!.trim().length > 100) errors.displayName = 'Use no more than 100 characters for your name.';
    return errors;
}
