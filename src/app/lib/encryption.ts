import forge from 'node-forge';

// Generate a key pair (public key and private key)
const keypair = forge.pki.rsa.generateKeyPair({ bits: 4096, e: 0x10001 });

// Convert the key pair to PEM format
const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

export function encrypt(message: string) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

  // Generate a random AES key and IV
  const aesKey = forge.random.getBytesSync(32); // AES-256 key
  const iv = forge.random.getBytesSync(16); // AES block size is 16 bytes

  // Encrypt the message with AES
  const cipher = forge.cipher.createCipher('AES-CBC', aesKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(message, 'utf8'));
  cipher.finish();
  const encryptedMessage = cipher.output.getBytes();

  // Encrypt the AES key with RSA
  const encryptedAesKey = publicKey.encrypt(aesKey, 'RSA-OAEP');

  // Encode both encrypted AES key and encrypted message in Base64
  return {
    encryptedMessage: forge.util.encode64(iv + encryptedMessage),
    encryptedAesKey: forge.util.encode64(encryptedAesKey)
  };
}

export function decryptMessage(encryptedData: { encryptedMessage: string, encryptedAesKey: string }) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

  // Decode the Base64 encoded data
  const encryptedMessageBytes = forge.util.decode64(encryptedData.encryptedMessage);
  const encryptedAesKeyBytes = forge.util.decode64(encryptedData.encryptedAesKey);

  // Decrypt the AES key with RSA
  const aesKey = privateKey.decrypt(encryptedAesKeyBytes, 'RSA-OAEP');

  // Extract the IV from the encrypted message
  const iv = encryptedMessageBytes.slice(0, 16);
  const encryptedMessage = encryptedMessageBytes.slice(16);

  // Decrypt the message with AES
  const decipher = forge.cipher.createDecipher('AES-CBC', aesKey);
  decipher.start({ iv });
  decipher.update(forge.util.createBuffer(encryptedMessage));
  decipher.finish();
  const decryptedMessage = decipher.output.toString();

  return decryptedMessage;
}
