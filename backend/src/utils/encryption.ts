import CryptoJS from 'crypto-js';
import { env } from '../config/env';

export function encrypt(value: string): string {
  return CryptoJS.AES.encrypt(value, env.aesKey).toString();
}

export function decrypt(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, env.aesKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
