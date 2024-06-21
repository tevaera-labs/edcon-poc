
import { Transaction } from "ethers";
import { TransactionRequest } from "ethers";
import { Provider, Wallet, Contract } from "zksync-ethers";

const accPrivateKey = process.env.WALLET_PRIVATE_KEY as string;

export const executeTransaction = async (decodedData: any)=>{
    try {
        const provider = new Provider("https://zksync-sepolia.drpc.org");
        const wallet = new Wallet(accPrivateKey as string, provider);
  
        const gasPrice = (await wallet?.provider.getFeeData()).gasPrice;
        const gasLimit = "1000000";
  
        const params = JSON.parse(decodedData);

        const {contractABI, contractAddress, method} = params
  
        const contract = new Contract(
          params.contractAddress,
          params.contractABI,
          wallet
        );
  
        const argsPassed = params.args;
  
        let args;
        if (method === "transferFrom") {
          args = argsPassed.map((arg: string) => {
            if (arg === "$walletAddress") {
              return "0xaE807e098C4bdb5e83E0629Ca49a50Bd1daa2072";
            } else if (arg === "$operator") {
              return "";
            } else if (arg === "$tokenId") {
              return 1;
            }
            return arg;
          });
        }
  
        const encodedTx = contract.interface.encodeFunctionData(
          params.method,
          args
        );
  
        const address = await wallet.getAddress();
        const transaction: TransactionRequest = {
          from: address,
          nonce: await wallet.provider.getTransactionCount(address),
          to: params.contractAddress,
          gasLimit,
          gasPrice: gasPrice?.toString(),
          data: encodedTx,
        };
  
        const signedTx = await wallet.signTransaction(transaction);
        // console.log(signedTx, "check,", Transaction.from(signedTx).serialized);
  
        const tx = await provider.broadcastTransaction(
          Transaction.from(signedTx).serialized
        );
  
        const data = await tx.wait();
        console.log("data:", data);
      } catch (error: any) {
        console.log(error);
      }
}