import dotenv from "dotenv";
import crypto from 'crypto';
import express from "express";
import cors from "cors"

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config()

const privateKey = process.env.PRIVATE_KEY as string;
const publicKey = process.env.PUBLIC_KEY as string;

app.get("/", (req: express.Request, res: express.Response) => {
    res.json("hello")
})

app.post("/encryption", (req: express.Request, res: express.Response) => {
    const { action, message } = req.body;

    try {
        if (action === 'encrypt') {
            try {
                // Encrypt the message with the public key
                const encryptedMessage = crypto.publicEncrypt(publicKey, Buffer.from(JSON.stringify(message)));
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
                const data = JSON.parse(decryptedMessage.toString())
                res.status(200).json({ decryptedMessage: data });
            } catch (error: any) {
                res.status(500).json({ error: 'Decryption failed', details: error.message });
            }
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Decryption failed', details: error.message });
    }

})

app.listen(3000, () => {
    console.log("Server running at 3000")
})