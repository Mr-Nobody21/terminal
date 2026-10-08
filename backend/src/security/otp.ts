import { timingSafeEqual } from 'node:crypto';
// Development placeholder requested by the user. Never shipped in the UI bundle.
const developmentCode='904530';
export function verifyDevelopmentOtp(otp:string):boolean {
 return /^\d{6}$/.test(otp)&&timingSafeEqual(Buffer.from(otp),Buffer.from(developmentCode));
}
