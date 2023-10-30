import * as crypto from "crypto";

const algorithm = "aes-256-cbc";
function encrypt(text, key, iv) {
  const algorithm = "aes-256-cbc";
  // Deriva la clave y el IV desde las cadenas UTF-8
  const derivedKey = Buffer.from(key, "utf8");
  console.log("🚀 ~ file: encryption.js:7 ~ encrypt ~ derivedKey:", derivedKey)
  const derivedIv = Buffer.from(iv, "utf8");
  console.log("🚀 ~ file: encryption.js:9 ~ encrypt ~ derivedIv:", derivedIv)
  let encrypted = "";

  key = crypto.scryptSync(text, key, 32);
  console.log("🚀 ~ file: encryption.js:12 ~ encrypt ~ key:", key)

  // Crea una instancia del cifrador AES-CTR con PKCS7
  const cipher = crypto.createCipheriv(algorithm, derivedKey, derivedIv);
  console.log("🚀 ~ file: encryption.js:16 ~ encrypt ~ cipher:", cipher)

  // Cifra el texto en formato utf-8
  encrypted = cipher.update(text, "utf8", "base64");
  console.log("🚀 ~ file: encryption.js:20 ~ encrypt ~ encrypted:", encrypted)
  cipher.setAutoPadding(true); // Habilita PKCS7
  let base64Value = cipher.final("base64");
  console.log("🚀 ~ file: encryption.js:23 ~ encrypt ~ base64Value:", base64Value)

  return base64Value;
}

function decrypt(encryptedText, key, iv) {
  // Deriva la clave y el IV desde las cadenas UTF-8
  const derivedKey = Buffer.from(key, "utf8");
  const derivedIv = Buffer.from(iv, "utf8");

  key = crypto.scryptSync(encryptedText, key, 32);
  const decipher = crypto.createCipheriv(algorithm, derivedKey, derivedIv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decipher.setAutoPadding(true); // Habilita PKCS7

  decrypted += decipher.final("utf8");
  return decrypted;
}

// Encrypt data
function encryptData(data, secret_key, secret_iv) {
  console.log("🚀 ~ file: encryption.js:44 ~ encryptData ~ data:", data)
  console.log("🚀 ~ file: encryption.js:44 ~ encryptData ~ secret_iv:", secret_iv)
  console.log("🚀 ~ file: encryption.js:44 ~ encryptData ~ secret_key:", secret_key)
  const encryptedTextBase64 = encrypt(data, secret_key, secret_iv);
  // const encryptedTextBase64 = '123'
  console.log("🚀 ~ file: encryption.js:48 ~ encryptData ~ encryptedTextBase64:", encryptedTextBase64)
  return encryptedTextBase64;
}

// Decrypt data
function decryptData(encryptedData, secret_key, secret_iv) {
  return decrypt(encryptedData, secret_key, secret_iv);
}

export default { decryptData, encryptData };
