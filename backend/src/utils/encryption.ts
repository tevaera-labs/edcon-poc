import forge from 'node-forge';

// Generate a key pair (public key and private key)
const keypair = forge.pki.rsa.generateKeyPair({ bits: 4096, e: 0x10001 });

// Convert the key pair to PEM format
const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

export function encrypt(message: string) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

  // Encrypt the message using the public key
  const encryptedMessage = publicKey.encrypt(message, 'RSA-OAEP');

  return forge.util.encode64(encryptedMessage);
}

export function decryptMessage(encryptedMessage: string) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

  // Decrypt the message using the private key
  const decryptedMessage = privateKey.decrypt(forge.util.decode64(encryptedMessage), 'RSA-OAEP');

  return decryptedMessage;
}