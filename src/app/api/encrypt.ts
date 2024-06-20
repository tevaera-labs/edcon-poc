import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

const publicKeyPath = path.resolve('./keys/public.pem');
const privateKeyPath = path.resolve('./keys/private.pem');

// Read the public and private keys
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

export default function handler(req: NextApiRequest, res:NextApiResponse) {
  if (req.method === 'POST') {
    const { action, message } = req.body;

    if (action === 'encrypt') {
      try {
        // Encrypt the message with the public key
        const encryptedMessage = crypto.publicEncrypt(publicKey, Buffer.from(message));
        res.status(200).json({ encryptedMessage: encryptedMessage.toString('base64') });
      } catch (error: any) {
        res.status(500).json({ error: 'Encryption failed', details: error.message });
      }
    } else if (action === 'decrypt') {
      try {
        // Decrypt the message with the private key
        const decryptedMessage = crypto.privateDecrypt(
          {
            key: privateKey,
            passphrase: '', // If your private key is protected with a passphrase
          },
          Buffer.from(message, 'base64')
        );
        res.status(200).json({ decryptedMessage: decryptedMessage.toString() });
      } catch (error: any) {
        res.status(500).json({ error: 'Decryption failed', details: error.message });
      }
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
