import { browser } from "$app/environment";

const ENCRYPTION_KEY = "gh-pr-management-token-encryption-key-2024";

function generateKey(): string {
  if (!browser) return "";

  let storedKey = localStorage.getItem("gh_encryption_key");
  if (!storedKey) {
    storedKey = ENCRYPTION_KEY + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("gh_encryption_key", storedKey);
  }
  return storedKey;
}

function simpleEncrypt(text: string, key: string): string {
  if (!browser) return text;

  let result = "";
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(textChar ^ keyChar);
  }
  return btoa(result);
}

function simpleDecrypt(encryptedText: string, key: string): string {
  if (!browser) return encryptedText;

  try {
    const text = atob(encryptedText);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return result;
  } catch (error) {
    console.error("Failed to decrypt token:", error);
    return "";
  }
}

export function encryptToken(token: string): string {
  if (!browser || !token) return token;

  const key = generateKey();
  return simpleEncrypt(token, key);
}

export function decryptToken(encryptedToken: string): string {
  if (!browser || !encryptedToken) return encryptedToken;

  const key = generateKey();
  return simpleDecrypt(encryptedToken, key);
}
