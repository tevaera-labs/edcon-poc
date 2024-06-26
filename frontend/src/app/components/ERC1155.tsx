import axios from "axios";

import React, { ChangeEvent, useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { toast, ToastContainer } from "react-toastify";
import { Reward } from "../utils/constants";

function ERC1155(props: any) {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [functionName, setFunctionName] = useState<string>("safeBatchTransferFrom");
  const [ChainId, setChainId] = useState<number>(1);
  const [qrString, setQrSTring] = useState<string>("");
  const [encodedData, setEncodedData] = useState<string>("");
  const [decodedData, setDecodeData] = useState<string>("");
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputList, setInputList] = useState([{ value: "", tokenId: "" }]);
  const [tokenData, setTokenData] = useState<string>("");
  const { walletAddress } = props;

  const handleChainId = (event: ChangeEvent<HTMLSelectElement>) => {
    setChainId(Number(event.target.value));
  };

  const decrypt = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:3000/encryption", {
      action: "decrypt",
      message: encodedData,
    });

    const decryptedData = res.data.decryptedMessage;
    setDecodeData(JSON.stringify(decryptedData));
    return decryptedData;
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
      
      const decryptedData = await decrypt(e);
      const {
        contractAddress,
        contractABI,
        method,
        reward,
        argsValue,
        chainId,
      } = decryptedData;

      const res = await axios.post("http://localhost:3000/executeTransaction", {
        recipientAddress: walletAddress,
        contractAddress,
        contractABI,
        method,
        reward,
        chainId,
        argsValue,
      });

      const result = res.data;
      toast.success(result);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFunctionChange = async (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setFunctionName(value);
  };

  async function createRawTransaction(e: any) {
    e.preventDefault();
    const index = inputList.length - 1;
    if (!inputList[index].value || Number(inputList[index].value) === 0) {
      toast.error("Token values cannot be empty or zero");
      return;
    }

    try {
      const method = functionName;

      const data = {
        contractAddress,
        method,
        argsValue: {
          tokenDetails: inputList,
          tokenData
        },
        reward: Reward.ERC1155,
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
      reward: Reward.ERC1155,
      contractAddress
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

  const handleAddInput = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    const index = inputList.length - 1;
    if (
      !(inputList[index].tokenId && inputList[index].value) &&
      functionName === "safeBatchTransferFrom"
    ) {
      toast.error("Fill in tokenId and Values.");
    } else {
      setInputList([...inputList, { value: "", tokenId: "" }]);
    }
  };

  const handleInputValueChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const newInputList = [...inputList];
    newInputList[index].value = event.target.value;
    setInputList(newInputList);
  };

  const handleInputTokenIdChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const newInputList = [...inputList];
    newInputList[index].tokenId = event.target.value;
    setInputList(newInputList);
  };

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

            <div className="sm:col-span-full mt-2">
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
                  <option value={"safeBatchTransferFrom"}> Batch Transfer</option>
                  <option value={"mint"}> Mint</option>
                </select>
              </div>
            </div>

            <div className="col-span-5">
              {inputList.map((item, index) => {
                return (
                  <div key={index} className="flex justify-between py-2">
                    <input
                      type="text"
                      placeholder="Token ID"
                      value={item.tokenId}
                      onChange={(event) =>
                        handleInputTokenIdChange(index, event)
                      }
                    />
                    <input
                      type="text"
                      placeholder="Amount"
                      value={item.value}
                      onChange={(event) => handleInputValueChange(index, event)}
                    />
                  </div>
                );
              })}
              {functionName === "safeBatchTransferFrom" && (
                <button
                  className="mt-3 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={handleAddInput}
                >
                  Add More
                </button>
              )}
            </div>

            {functionName === "mint" && (
              <div className="sm:col-span-5 sm:col-start-1 mt-3">
                <input
                  type="text"
                  placeholder="tokenData"
                  value={tokenData}
                  onChange={(event) => setTokenData(event.target.value)}
                />
              </div>
            )}

            {functionName === "safeBatchTransferFrom" && (
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
                  <option value={300}>ZkSync Sepolia</option>
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
              disabled={functionName === "safeBatchTransferFrom" && !isApproved}
              onClick={createRawTransaction}
              className={`${
                !isApproved && functionName === "safeBatchTransferFrom"
                  ? "opacity-70 cursor-not-allowed"
                  : "opacity-100"
              } rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
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
      <ToastContainer />
    </>
  );
}

export default ERC1155;
