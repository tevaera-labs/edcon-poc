
import { hexlify, toUtf8Bytes } from "ethers";
import { Wallet, Provider, Contract } from "zksync-ethers";
import dotenv from "dotenv";
import { erc20abi } from "../utils/erc20abi";
import { erc721abi } from "../utils/erc721abi";
import { erc1155abi } from "../utils/erc1155abi";
import { ContractMethods, chainRpcMap } from "../utils/constants";

dotenv.config();

const accPrivateKey = process.env.WALLET_PRIVATE_KEY as string;

const executeErc20Transaction = async (contract: Contract, data: any, spenderAddress: string) => {
  const { method, argsValue, recipientAddress } = data
  const { amount } = argsValue;

  if (method === ContractMethods.TRANSFER) {
    await contract.transfer(recipientAddress, amount);
    return "Successfully transfered token";
  } else if (method === ContractMethods.TRANSFER_FROM) {
    await contract.transferFrom(spenderAddress, recipientAddress, amount);
    return "Successfully transfered token"
  } else {
    throw new Error("Invalid Request");
  }
}

const executeErc721Transaction = async (contract: Contract, data: any, spenderAddress: string) => {
  const { method, recipientAddress } = data

  //tokenId will come from backend increment by 1 and add it here...
  const tokenId = 1; // this will be fetched from db and auto incremented after a successfull transfer
  if (method === ContractMethods.TRANSFER_FROM) {
    await contract.transferFrom(spenderAddress, recipientAddress, tokenId);
    return "Successfully transfered token"
  } else {
    throw new Error("Invalid Request")
  }
}

const executeErc1155Transaction = async (contract: Contract, data: any, spenderAddress: string) => {
  const { method, recipientAddress, argsValue } = data
  const { tokenDetails, tokenData } = argsValue;


  if (method === ContractMethods.SAFE_BATCH_TRANSFER_FROM) {
    const hexdata = hexlify("0x"); // Additional data, if any
    const ids = tokenDetails.map((item: any) => item.tokenId);
    const amounts = tokenDetails.map((item: any) => item.value);

    await contract.safeBatchTransferFrom(spenderAddress, recipientAddress, ids, amounts, hexdata);
    return "Successully transfered token"
  } else if (method === ContractMethods.MINT) {
    const hexdata = tokenData ? hexlify(toUtf8Bytes(tokenData)) : "0x"; // Additional data, if any
    const id = tokenDetails[0].tokenId ?? 1;   // here you will have to get id from db or onchain accordingly
    const amount = tokenDetails[0].value;

    await contract.mint(recipientAddress, id, amount, hexdata);
    return "Successfully minted the token"
  } else {
    throw new Error("Invalid Request")
  }
}

export const executeTransaction = async (data: any) => {
  const { contractAddress, reward, chainId } = data
  let contractAbi;
  let response = {
    status: 200,
    message: ""
  };

  try {
    const rpcUrl = chainRpcMap[chainId];
    const provider = new Provider(rpcUrl);
    const wallet = new Wallet(accPrivateKey as string, provider);
    const spenderAddress = await wallet.getAddress();

    if (reward === "erc20") {
      contractAbi = erc20abi;
      const contract = new Contract(
        contractAddress,
        contractAbi,
        wallet
      );
      response.message = await executeErc20Transaction(contract, data, spenderAddress);
    } else if (reward === "erc721") {
      contractAbi = erc721abi;
      const contract = new Contract(
        contractAddress,
        contractAbi,
        wallet
      );
      response.message = await executeErc721Transaction(contract, data, spenderAddress);
    } else {
      contractAbi = erc1155abi;
      const contract = new Contract(
        contractAddress,
        contractAbi,
        wallet
      );
      response.message = await executeErc1155Transaction(contract, data, spenderAddress);
    }
  } catch (error: any) {
    response.status = 400;
    response.message = error.message
  }

  return response;
}