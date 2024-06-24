
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
  const allowance = await contract.allowance(spender, owner);
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

  const spender = process.env.SPENDER_ADDRESS as string;

  const { amount , tokenDetails } = argsValue;
  const tokenId = 1; // this will be fetched from db and auto incremented after a successfull transfer

  if (method === "transferFrom") {
    if(reward === "erc20"){
      await checkAllowance(contract, await wallet.getAddress(), spender, amount);
      await checkBalance(contract, spender, amount);
      await contract.transferFrom(spender, walletAddress, amount);
    }else{
      await contract.transferFrom(spender, walletAddress, tokenId);
    }
  } else if (method === "transfer") {
    if (reward === "erc20") {
      await contract.transfer(walletAddress, amount);
    } else {
      //tokenId will come from backend increment by 1 and add it here...
      await contract.transfer(walletAddress, tokenId);
    }
  } else if (method === "multiTransfer") {
    const hexdata = hexlify(getBytes("0x")); // Additional data, if any
    const ids = tokenDetails.map((item: any)=> item.tokenId);
    const amounts = tokenDetails.map((item: any)=> item.value);
    await contract.safeBatchTransferFrom(spender, walletAddress, ids, amounts, hexdata);
  }

  return "Successfully transfered reward";
}