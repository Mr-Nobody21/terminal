import { describe, expect, it } from 'vitest';
import { disposableEmail, validateCredentials } from './validation';
const valid = { email: 'person@gmail.com', password: 'a unique long passphrase', displayName: 'Person' };
describe('client-only credential validation', () => {
 it.each(['person@yopmail.com','person@mail.yopmail.com','person@YOPMAIL.COM','person@mailinator.com','person@guerrillamail.com','person@10minutemail.com'])('blocks disposable registration email %s', email => {
  expect(disposableEmail(email)).toBe(true);
  expect(validateCredentials({ ...valid, email }, true).email).toContain('permanent');
 });
 it.each(['person@gmail.com','person+planner@outlook.com','name@mail.company.org','someone@yopmail.com.company.org'])('allows permanent addresses without substring blocking: %s', email => {
  expect(disposableEmail(email)).toBe(false);expect(validateCredentials({ ...valid, email }, true)).toEqual({});
 });
 it.each(['','person','person@','person@@gmail.com','person@localhost','person..name@gmail.com'])('shows an actionable email error for %s', email => {
  expect(validateCredentials({ ...valid, email }, true).email).toBeTruthy();
 });
 it.each(['short','password123456','aaaaaaaaaaaa','            ','123456789012','x'.repeat(129)])('rejects invalid registration passwords', password => {
  expect(validateCredentials({ ...valid, password }, true).password).toBeTruthy();
 });
 it('accepts passphrases without arbitrary composition requirements and preserves whitespace', () => {
  expect(validateCredentials({ ...valid, email: ' Person@Gmail.com ', password: 'a long useful passphrase ' }, true)).toEqual({});
 });
 it('does not apply registration restrictions to existing users signing in', () => {
  expect(validateCredentials({ ...valid, email: 'existing@yopmail.com', password: 'password123456' }, false)).toEqual({});
 });
 it('validates the registration name and password bounds', () => {
  expect(validateCredentials({ ...valid, displayName: ' ' }, true)).toHaveProperty('displayName');
  expect(validateCredentials({ ...valid, displayName: 'x'.repeat(101) }, true)).toHaveProperty('displayName');
  expect(validateCredentials({ ...valid, password: '' }, false).password).toContain('Enter');
 });
});
