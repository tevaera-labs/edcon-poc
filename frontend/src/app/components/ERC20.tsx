import React, { ChangeEvent, useEffect, useState } from "react";
import { Contract, Provider, Wallet } from "zksync-ethers";
import { QRCode } from "react-qrcode-logo";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { erc20Abi } from "../utils/erc20abi";
import { Reward, chainRpcMap } from "../utils/constants";

function ERC20(props: any) {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [functionName, setFunctionName] = useState<string>("transfer");

  const [ChainId, setChainId] = useState<number>(1);
  const [encodedData, setEncodedData] = useState<string>("");
  const [decodedData, setDecodeData] = useState<string>("");
  const [qrString, setQrSTring] = useState<string>("");
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { walletAddress } = props;

  const accPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
  const spenderAddress = process.env.NEXT_PUBLIC_SPENDER_ADDRESS;

  const decrypt = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:3000/encryption", {
      action: "decrypt",
      message: encodedData,
    });

    const decryptedData = res.data.decryptedMessage;
    console.log(decryptedData);
    setDecodeData(JSON.stringify(decryptedData));
  };

  const copyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(qrString);
    } catch (error) {}
  };

  const executeTx = async (e: any) => {
    e.preventDefault();
    // setIsLoading(true);
    try {
      await decrypt(e);
      const decryptedData = JSON.parse(decodedData);
      const { contractAddress, method, reward, argsValue, chainId } =
        decryptedData;
      const { amount, spender, tokenId } = argsValue;
      const newargsValue = {
        amount,
        spender,
        tokenId,
      };

      const res = await axios.post("http://localhost:3000/executeTransaction", {
        recipientAddress: walletAddress,
        contractAddress,
        method,
        reward,
        chainId,
        argsValue: newargsValue,
      });

      const result = res.data;
      toast.success(result);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  async function createRawTransaction(e: any) {
    e.preventDefault();

    if (!contractAddress) {
      toast.error("Contract address needs to be filled.");
      return;
    }

    try {
      let method = "";
      if (functionName === "transfer") {
        method = functionName;
      } else {
        method = functionName;
      }

      const data = {
        contractAddress,
        method: functionName,
        argsValue: {
          amount,
          spender: spenderAddress,
        },
        reward: "erc20",
        chainId: ChainId.toString(),
      };

      const res = await axios.post("http://localhost:3000/encryption", {
        action: "encrypt",
        message: data,
      });

      const encryptedData = res.data.encryptedMessage;

      setEncodedData(encryptedData);
      const url =
        `intent://yourapp/mint?data=${encryptedData}` +
        `#Intent;scheme=http;package=com.yourcompany.yourapp;end`;

      setQrSTring(url);
    } catch (error) {
      console.log(error);
    }
  }

  const handleTransferFrom = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await axios.post("http://localhost:3000/approveFunds", {
      walletAddress,
      chainId: ChainId,
      reward: Reward.ERC20,
      contractAddress,
      amount
    });

    if(res.status === 200){
      setIsApproved(true);
      toast.success(res.data);
    }else{
      setIsApproved(false);
      toast.error(res.data)
    }
    setIsLoading(false);
  };

  const handleFunctionChange = async (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setFunctionName(value);
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
                htmlFor="amount"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Total amount to be transfered
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  onChange={(e) => setAmount(Number(e.target.value))}
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
                defaultValue={"transfer"}
                onChange={handleFunctionChange}
                className="text-black rounded-md"
              >
                <option value={"transferFrom"}>Transfer From</option>
                <option value={"transfer"}>Transfer</option>
                {/* <option value={"other"}>Other</option> */}
              </select>
            </div>
          </div>
          {functionName === "transferFrom" && (
            <div className="sm:col-span-5 sm:col-start-1 mt-3">
              <div className="mt-2 flex justify-between">
                {isLoading ? (
                  <button
                    disabled
                    type="button"
                    className="cursor-not-allowed rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Loading..
                  </button>
                ) : (
                  <button
                    onClick={handleTransferFrom}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Approve Funds
                  </button>
                )}
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
                <option value={300}>ZkSync Sepolia</option>
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
              disabled={functionName === "transferFrom" && !isApproved}
              onClick={createRawTransaction}
              className={`${
                !isApproved && functionName === "transferFrom"
                  ? "opacity-70"
                  : "opacity-100"
              } rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
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

            {isLoading ? (
              <button
                disabled
                type="button"
                className="cursor-not-allowed rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Loading..
              </button>
            ) : (
              <button
                type="submit"
                onClick={executeTx}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Execute Transaction
              </button>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default ERC20;
