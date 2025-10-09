import { browser } from "$app/environment";

const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

interface EncryptedToken {
  iv: string;
  salt: string;
  data: string;
}

function getEncryptionSecret(): string {
  const secret = import.meta.env.VITE_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("VITE_ENCRYPTION_SECRET environment variable is not set");
  }
  return secret;
}

async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const secret = getEncryptionSecret();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret + userId),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isTokenEncrypted(token: string): boolean {
  return token.startsWith("encrypted:");
}

export async function encryptSensitiveData(
  data: string,
  userId: string
): Promise<string> {
  if (!browser || !data) {
    return data;
  }

  if (isTokenEncrypted(data)) {
    return data;
  }

  try {
    const iv = generateRandomBytes(IV_LENGTH);
    const salt = generateRandomBytes(SALT_LENGTH);
    const key = await deriveKey(userId, salt);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      new TextEncoder().encode(data)
    );

    const encryptedToken: EncryptedToken = {
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      data: arrayBufferToBase64(encryptedData),
    };

    return `encrypted:${encryptedToken.iv}:${encryptedToken.salt}:${encryptedToken.data}`;
  } catch (error) {
    throw new Error("Data encryption failed");
  }
}

export async function decryptSensitiveData(
  encryptedData: string,
  userId: string
): Promise<string> {
  if (!browser || !encryptedData) {
    return encryptedData;
  }

  if (!isTokenEncrypted(encryptedData)) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 4 || parts[0] !== "encrypted") {
      throw new Error("Invalid encrypted data format");
    }

    const [, ivBase64, saltBase64, dataBase64] = parts;

    const iv = base64ToArrayBuffer(ivBase64);
    const salt = base64ToArrayBuffer(saltBase64);
    const encryptedDataBuffer = base64ToArrayBuffer(dataBase64);

    const key = await deriveKey(userId, new Uint8Array(salt));

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: new Uint8Array(iv),
      },
      key,
      encryptedDataBuffer
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    throw new Error("Data decryption failed");
  }
}

export async function encryptGitHubToken(
  token: string,
  userId: string
): Promise<string> {
  if (!browser || !token) {
    return token;
  }

  if (isTokenEncrypted(token)) {
    return token;
  }

  try {
    const iv = generateRandomBytes(IV_LENGTH);
    const salt = generateRandomBytes(SALT_LENGTH);
    const key = await deriveKey(userId, salt);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      new TextEncoder().encode(token)
    );

    const encryptedToken: EncryptedToken = {
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      data: arrayBufferToBase64(encryptedData),
    };

    return `encrypted:${encryptedToken.iv}:${encryptedToken.salt}:${encryptedToken.data}`;
  } catch (error) {
    throw new Error("Token encryption failed");
  }
}

export async function decryptGitHubToken(
  encryptedToken: string,
  userId: string
): Promise<string> {
  if (!browser || !encryptedToken) {
    return encryptedToken;
  }

  if (!isTokenEncrypted(encryptedToken)) {
    return encryptedToken;
  }

  try {
    const parts = encryptedToken.split(":");
    if (parts.length !== 4 || parts[0] !== "encrypted") {
      throw new Error("Invalid encrypted token format");
    }

    const [, ivBase64, saltBase64, dataBase64] = parts;

    const iv = base64ToArrayBuffer(ivBase64);
    const salt = base64ToArrayBuffer(saltBase64);
    const encryptedData = base64ToArrayBuffer(dataBase64);

    const key = await deriveKey(userId, new Uint8Array(salt));

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: new Uint8Array(iv),
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    throw new Error("Token decryption failed");
  }
}

export async function migrateTokenIfNeeded(
  token: string,
  userId: string
): Promise<string> {
  if (!browser || !token) {
    return token;
  }

  if (isTokenEncrypted(token)) {
    return token;
  }

  try {
    return await encryptGitHubToken(token, userId);
  } catch (error) {
    return token;
  }
}
