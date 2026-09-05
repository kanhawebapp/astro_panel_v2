import CryptoJS from "crypto-js";
const SECRET_KEY = process.env.NEXT_PUBLIC_CHAT_AES_KEY || "dev_secret_key_123";


export function encryptParams(data, key = SECRET_KEY) {
  const json = JSON.stringify(data);
  const ciphertext = CryptoJS.AES.encrypt(json, key).toString();
  return encodeURIComponent(ciphertext);
}


export function decryptParams(encrypted, key = SECRET_KEY) {
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encrypted), key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
}
