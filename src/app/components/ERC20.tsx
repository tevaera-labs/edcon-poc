import React, { ChangeEvent, useState } from "react";
import { decryptMessage, encrypt } from "../lib/encryption";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import {
  defaultErc20TransferAbi,
  defaultErc20TransferFromAbi,
} from "@/utils/erc20abi";
import { TransactionRequest } from "ethers";
import { Contract, Provider, Wallet } from "zksync-ethers";
import { Transaction } from "ethers";
import { QRCode } from "react-qrcode-logo";

function ERC20() {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [quantity, setQuantity] = useState<number>();
  const [functionName, setFunctionName] = useState<string>("transfer");
  const [otherFunctionName, setOtherFunctionName] = useState<string>("");

  const [abi, setAbi] = useState<string>("");
  const [otherAbi, setOtherAbi] = useState<string>("");
  const [ChainId, setChainId] = useState<number>(1);
  const [encodedData, setEncodedData] = useState<{
    encryptedMessage: string;
    encryptedAesKey: string;
  }>({ encryptedAesKey: "", encryptedMessage: "" });
  const [decodedData, setDecodeData] = useState<string>("");
  const [qrString, setQrSTring] = useState<string>("");
  const [inputList, setInputList] = useState([
    { value: "$walletAddress", placeHolder: "Ex: $walletAddress" },
  ]);

  const placeHolders = ["Ex: $walletAddress", "Ex: $quantity", "Ex: $others"];

  const accPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

  const decrypt = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const data = decryptMessage(encodedData);
    console.log(JSON.parse(data));
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

  const handleAddInput = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    setInputList([
      ...inputList,
      { value: "", placeHolder: placeHolders[Math.floor(Math.random() * 3)] },
    ]);
  };

  async function createRawTransaction(e: any) {
    e.preventDefault();
    try {
      const contractABI = JSON.parse(abi);
      let method = "";
      const args = inputList.map(input=>input.value);

      if (functionName === "other") {
        method = otherFunctionName;
      } else {
        method = functionName;
      }

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

  const handleInputChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const newInputList = [...inputList];
    newInputList[index].value = event.target.value;
    setInputList(newInputList);
  };

  const handleFunctionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFunctionName(value);

    if (value === "transfer") {
      setAbi(JSON.stringify(defaultErc20TransferAbi));
    } else if (value === "transferFrom") {
      setAbi(JSON.stringify(defaultErc20TransferFromAbi));
    }
  };

  return (
    <>
      <div className="mt-10 flex justify-between text-black">
        <div className="w-1/2">
          <p className="text-lg leading-5 text-black-600">ERC 20</p>
          <div className="col-span-full mt-5">
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
          {functionName !== "other" && (
            <div className="sm:col-span-5 mt-5">
              <label
                htmlFor="quantity"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Total quantity to be transfered
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  autoComplete="given-name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          )}
          <div className="sm:col-span-full mt-5">
            <label
              htmlFor="functionName"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Choose function name
            </label>
            <div className="mt-2">
              <select
                onChange={handleFunctionChange}
                className="text-black rounded-md"
              >
                <option value={"transferFrom"}>Transfer From</option>
                <option value={"transfer"}>Transfer</option>
                <option value={"other"}>Other</option>
              </select>
            </div>
          </div>
          {functionName !== "transfer" && functionName !== "transferFrom" && (
            <div className="col-span-full">
              <div className="sm:col-span-5 sm:col-start-1">
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
                    onChange={(e) => setOtherFunctionName(e.target.value)}
                    autoComplete="address-level2"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="col-span-full mt-4">
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
              <div className="sm:col-span-6 mt-5">
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
            </div>
          )}
          <div className="sm:col-span-5 mt-4">
            <label
              htmlFor="chain-id"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              ChainId (Number)
            </label>
            <div className="mt-2">
              <select
                onChange={(e) => setChainId(Number(e.target.value))}
                className="text-black rounded-md"
                defaultValue={324}
              >
                <option value={1}>Ethereum</option>
                <option value={324}>ZkSync</option>
                <option value={8453}>Base</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between col-span-full">
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
        <div className="w-1/2 mx-auto px-8 mt-8 flex flex-col items-center">
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

export default ERC20;
