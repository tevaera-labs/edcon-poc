
import { Transaction } from "ethers";
import { TransactionRequest } from "ethers";
import { Provider, Wallet, Contract } from "zksync-ethers";
import dotenv from "dotenv";

dotenv.config();

const accPrivateKey = process.env.WALLET_PRIVATE_KEY as string;

export const executeTransaction = async (data: any) => {
  try {
    const provider = new Provider("https://zksync-sepolia.drpc.org");
    const wallet = new Wallet(accPrivateKey as string, provider);

    const gasPrice = (await wallet?.provider.getFeeData()).gasPrice;
    const gasLimit = "1000000";

    const { contractABI, contractAddress, method, args, argsValue, walletAddress } = data

    const contract = new Contract(
      contractAddress,
      contractABI,
      wallet
    );

    let argsPassed;
    const { spender, tokenId, amount } = argsValue;

    if (method === "transferFrom") {
      argsPassed = args.map((arg: string) => {
        if (arg === "$walletAddress" || arg === "$recipient") {
          return walletAddress;
        } else if (arg === "$operator" || arg === "$sender") {
          return spender;
        } else if (arg === "$tokenId") {
          return tokenId;
        } else if (arg === "$amount") {
          return amount.toString();
        }
        return arg;
      });
    } else if (method === "transfer") {
      argsPassed = args.map((arg: string) => {
        if (arg === "$walletAddress") {
          return walletAddress;
        } else if (arg === "$amount") {
          return amount;
        }
        return arg;
      });
    }

    const encodedTx = contract.interface.encodeFunctionData(
      method,
      argsPassed
    );

    const address = await wallet.getAddress();
    const transaction: TransactionRequest = {
      from: address,
      nonce: await wallet.provider.getTransactionCount(address),
      to: contractAddress,
      gasLimit,
      gasPrice: gasPrice?.toString(),
      data: encodedTx,
    };

    const signedTx = await wallet.signTransaction(transaction);
    // console.log(signedTx, "check,", Transaction.from(signedTx).serialized);

    const tx = await provider.broadcastTransaction(
      Transaction.from(signedTx).serialized
    );

    await tx.wait();
    return "Successfully transfered reward"
  } catch (error: any) {
    console.log(error);
    return "ERROR" + error.message;
  }
}
