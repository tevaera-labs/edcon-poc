import { PlusCircleIcon } from "@heroicons/react/24/solid";
import axios from "axios";

import React, { ChangeEvent, useState } from "react";
import { decryptMessage, encrypt } from "../lib/encryption";
import { QRCode } from "react-qrcode-logo";
import { Transaction } from "ethers";
import { TransactionRequest } from "ethers";
import { Provider, Wallet, Contract } from "zksync-ethers";
const pinataSDK = require("@pinata/sdk");

const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
const pinata = new pinataSDK({ pinataJWTKey: jwt });

function Nft() {
  const [nftName, setNftSName] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tokenUri, setTokenUri] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fnName, setFnName] = useState<string>("");
  const [ChainId, setChainId] = useState<number>(1);
  const [parameters, setParameters] = useState<string>("");
  const [abi, setAbi] = useState<string>("");
  const [qrString, setQrSTring] = useState<string>("");
  const [encodedData, setEncodedData] = useState<{
    encryptedMessage: string;
    encryptedAesKey: string;
  }>({ encryptedAesKey: "", encryptedMessage: "" });
  const [imgIpfs, setimgIpfs] = useState<string>("");
  const [decodedData, setDecodeData] = useState<string>("");
  const [inputList, setInputList] = useState([
    { value: "$walletAddress", placeHolder: "Ex: $walletAddress" },
  ]);
  const [showMessage, setShowMessage] = useState(false);

  const placeHolders = ["Ex: $walletAddress", "Ex: TOKEN_URI", "Ex: Count"];

  const accPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

  const handleChainId = (event: ChangeEvent<HTMLSelectElement>) => {
    setChainId(Number(event.target.value));
  };

  const handleAddInput = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    setInputList([
      ...inputList,
      { value: "", placeHolder: placeHolders[Math.floor(Math.random() * 3)] },
    ]);
  };

  const addImgToIpfs = async (): Promise<string> => {
    const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

    const formData = new FormData();
    formData.append("file", file as File);

    const pinataMetadata = JSON.stringify({
      name: file?.name as string,
    });
    formData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", pinataOptions);

    try {
      const res = await axios.post(pinataUrl, formData, {
        maxBodyLength: 1000000000000,
        headers: {
          "Content-Type": `multipart/form-data;`,
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log(res.data);
      setimgIpfs(res.data.IpfsHash);
      return res.data.IpfsHash;
    } catch (error) {
      console.log(error);
      return "";
    }
  };

  const decrypt = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const data = decryptMessage(encodedData);
    setDecodeData(data);
  };

  const copyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(qrString);
    } catch (error) {}
  };

  const executeTx = async (e: any) => {
    e.preventDefault();

    try {
      const provider = new Provider("https://zksync-sepolia.drpc.org");
      const wallet = new Wallet(accPrivateKey as string, provider);

      const gasPrice = (await wallet?.provider.getFeeData()).gasPrice;
      const gasLimit = "1000000";

      const params = JSON.parse(decodedData);

      const contract = new Contract(
        params.contractAddress,
        params.contractABI,
        wallet
      );

      const argsPassed = params.args;

      let args = argsPassed;

      if (argsPassed.includes("$walletAddress")) {
        args = args.map((arg: string) => {
          if (arg === "$walletAddress") {
            return "0xaE807e098C4bdb5e83E0629Ca49a50Bd1daa2072";
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
      console.log(signedTx, "check,", Transaction.from(signedTx).serialized);

      const tx = await provider.broadcastTransaction(
        Transaction.from(signedTx).serialized
      );

      const data = await tx.wait();
      console.log(tx, "data:", data);
    } catch (error) {
      console.log(error);
    }
  };
  const handleInputChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const newInputList = [...inputList];
    newInputList[index].value = event.target.value;
    setInputList(newInputList);
  };

  const generateTokenUri = async (e: any) => {
    e?.preventDefault();
    const img = await addImgToIpfs();
    console.log(nftName, description, `ipfs://${img}`);
    const json = {
      name: nftName,
      description: description,
      image: `ipfs://${img}`,
    };

    const res = await pinata.pinJSONToIPFS(json);
    setTokenUri(`https://ipfs.io/ipfs/${res.IpfsHash}`);
    console.log(res);
  };

  async function createRawTransaction(e: any) {
    e.preventDefault();
    try {
      const contractABI = JSON.parse(abi);
      const method = fnName;
      const args = inputList.map(input=>input.value);

      const data = {
        contractAddress,
        contractABI,
        method,
        args,
        chainId: ChainId?.toString,
      };

      const encryptedData = encrypt(JSON.stringify(data));
      console.log(encryptedData, "data");
      setEncodedData(encryptedData);
      const url =
        `intent://yourapp/mint?data=${encryptedData}` +
        `#Intent;scheme=http;package=com.yourcompany.yourapp;end`;

      setQrSTring(url);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <div className="mt-10 flex justify-between text-black">
        <div className="w-1/2">
          <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <h3 className="text-md sm:col-span-6 font-semibold leading-6 text-gray-900">
              Generate QR Code
            </h3>

            <div className="col-span-full">
              <label
                htmlFor="contract-address"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Contract address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="contract-address"
                  id="contract-address"
                  onChange={(e) => setContractAddress(e.target.value)}
                  autoComplete="contract-address"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3 sm:col-start-1">
              <label
                htmlFor="Function Name"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Function Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="Function Name"
                  id="Function Name"
                  onChange={(e) => setFnName(e.target.value)}
                  autoComplete="address-level2"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="parameters"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Parameters (Click on &nbsp;
                <span>
                  <PlusCircleIcon
                    style={{ display: "inline-block" }}
                    className="h-5 w-5 -m-1"
                  />
                </span>
                &nbsp; icon to add more parameters)
              </label>
              <div className="mt-2">
                {inputList.map((input, index) => (
                  <input
                    key={index}
                    type="text"
                    value={input.value}
                    placeholder={input.placeHolder}
                    onChange={(event) => handleInputChange(index, event)}
                    className="mb-2 me-2 p-2 border border-gray-300 rounded text-black"
                  />
                ))}
              </div>
              <button
                onClick={(event) => handleAddInput(event)}
                className="px-1 py-2 bg-blue-500 text-white rounded"
              >
                <PlusCircleIcon
                  className="mx-auto h-5 w-5 -m-1"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="abi"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Contract ABI
              </label>
              <div className="mt-2">
                <textarea
                  id="abi"
                  name="abi"
                  rows={4}
                  onChange={(e) => setAbi(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  defaultValue={""}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="chain-id"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                ChainId (Number)
              </label>
              <div className="mt-2">
                <select
                  onChange={handleChainId}
                  className="text-black rounded-md"
                  defaultValue={324}
                >
                  <option value={1}>Ethereum</option>
                  <option value={324}>ZkSync</option>
                  <option value={8453}>Base</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 mb-4 flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancel
            </button>
            <button
              // type="submit"
              onClick={createRawTransaction}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Generate QR
            </button>
          </div>
        </div>
        <div className="w-1/2 mx-auto px-8 flex flex-col items-center justify-end">
          <div className="w-[300px] shadow-lg p-3">
            <QRCode value={qrString} size={300} />
          </div>
          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="text-sm font-semibold leading-6 text-gray-900"
              onClick={copyQRCode}
            >
              Copy
            </button>
            <button
              type="submit"
              // onClick={createRawTransaction}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Download
            </button>
            <button
              type="submit"
              onClick={decrypt}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Decode
            </button>
            <button
              type="submit"
              onClick={executeTx}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Execute Transaction
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Nft;
