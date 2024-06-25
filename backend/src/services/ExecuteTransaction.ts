
import { hexlify, toUtf8Bytes } from "ethers";
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
  const { contractAddress, method, argsValue, recipientAddress, reward, chainId } = data
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

  const { amount , tokenDetails, tokenData } = argsValue;

  if (method === "transferFrom") {
    if(reward === "erc20"){
      await checkAllowance(contract, await wallet.getAddress(), spender, amount);
      await checkBalance(contract, spender, amount);
      await contract.transferFrom(spender, recipientAddress, amount);  
    }else{
      const tokenId = 1; // this will be fetched from db and auto incremented after a successfull transfer
      await contract.transferFrom(spender, recipientAddress, tokenId);
    }
  } else if (method === "transfer") {
    if (reward === "erc20") {
      await contract.transfer(recipientAddress, amount);
    } else {
      //tokenId will come from backend increment by 1 and add it here...
      const tokenId = 1; // this will be fetched from db and auto incremented after a successfull transfer
      await contract.transfer(recipientAddress, tokenId);
    }
  } else if (method === "multiTransfer") {
    const hexdata = hexlify("0x"); // Additional data, if any
    const ids = tokenDetails.map((item: any)=> item.tokenId);
    const amounts = tokenDetails.map((item: any)=> item.value);
    await contract.safeBatchTransferFrom(spender, recipientAddress, ids, amounts, hexdata);
  }else if(method === "mint") {
    const hexdata = tokenData ? hexlify(toUtf8Bytes(tokenData)) : "0x"; // Additional data, if any
    const id = tokenDetails[0].tokenId ?? 1;   // here you will have to get id from db or onchain accordingly
    const amount = tokenDetails[0].value;
    console.log(hexdata, id, amount);
    await contract.mint(recipientAddress, id, amount, hexdata);
  }else{
    throw new Error("Invalid Request")
  }

  return "Successfully transfered reward";
}