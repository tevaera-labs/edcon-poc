import { PlusCircleIcon } from "@heroicons/react/24/solid";
import axios from "axios";

import React, { ChangeEvent, useState } from "react";
import { decryptMessage, encrypt } from "../lib/encryption";
import { QRCode } from "react-qrcode-logo";
import { Transaction } from "ethers";
import { TransactionRequest } from "ethers";
import { Provider, Wallet, Contract } from "zksync-ethers";
import { toast, ToastContainer } from "react-toastify";
import { defaultErc721TransferFromAbi } from "../../utils/erc721abi";

function Nft() {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [functionName, setFunctionName] = useState<string>("transferFrom");
  const [fnName, setFnName] = useState<string>("");
  const [ChainId, setChainId] = useState<number>(1);
  const [abi, setAbi] = useState<string>("");
  const [qrString, setQrSTring] = useState<string>("");
  const [encodedData, setEncodedData] = useState<string>("");
  const [decodedData, setDecodeData] = useState<string>("");
  const [inputList, setInputList] = useState([
    {
      value: "$operator",
      placeHolder: "Ex: $operator",
    },
    {
      value: "$walletAddress",
      placeHolder: "Ex: $walletAddress",
    },
    {
      value: "$tokenId",
      placeHolder: "Ex: $tokenId",
    },
  ]);

  const [operatorAddress, setOperatorAddress] = useState<string>("");
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const placeHolders = ["Ex: $walletAddress", "Ex: $token_id", "Ex: $operator"];

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

  const decrypt = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:3000/executeTransaction", {
      action: "decrypt",
      message: encodedData,
    });

    const decryptedData = res.data.decryptedMessage;
    console.log(decryptedData)
    setDecodeData(JSON.stringify(decryptedData));
  };

  const copyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(qrString);
    } catch (error) {}
  };

  const executeTx = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

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

      let args;
      if (functionName === "transferFrom") {
        args = argsPassed.map((arg: string) => {
          if (arg === "$walletAddress") {
            return "0xaE807e098C4bdb5e83E0629Ca49a50Bd1daa2072";
          } else if (arg === "$operator") {
            return operatorAddress;
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
      toast.success("NFT Transfered Successfully");
    } catch (error: any) {
      console.log(error);
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  const ownerAddress = "0x6831b65e17b309588f8Da83861679FF85C2e8974";

  const handleTransferFrom = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    const provider = new Provider("https://zksync-sepolia.drpc.org");
    const wallet = new Wallet(accPrivateKey as string, provider);

    const contractABI = [
      "function isApprovedForAll(address owner, address operator) external view returns (bool)",
      "function setApprovalForAll(address operator, bool _approved) external",
    ];

    const contract = new Contract(contractAddress, contractABI, wallet);
    try {
      const isApproved = false;

      if (!isApproved) {
        console.log(
          `Operator is not approved. Approving operator ${operatorAddress}...`
        );

        // Set approval for all tokens
        const approveTx = await contract.setApprovalForAll(
          operatorAddress,
          true
        );
        console.log("Approval transaction hash:", approveTx.hash);

        // Wait for the transaction to be mined
        await approveTx.wait();
        toast.success("Operator approved.");
      } else {
        toast.success("Operator is already approved.");
      }
      setIsApproved(true);
    } catch (error: any) {
      toast.error(error.message);
      setIsApproved(false);
    }
    setIsLoading(false);
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

  const handleFunctionChange = async (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setFunctionName(value);

    if (value === "transferFrom") {
      setInputList([
        {
          value: "$operator",
          placeHolder: "Ex: $operator",
        },
        {
          value: "$walletAddress",
          placeHolder: "Ex: $walletAddress",
        },
        {
          value: "$tokenId",
          placeHolder: "Ex: $tokenId",
        },
      ]);
    }
  };

  async function createRawTransaction(e: any) {
    e.preventDefault();
    try {
      let contractABI;
      const method = functionName;
      const args = inputList.map((input) => input.value);

      if (functionName === "transferFrom") {
        contractABI = JSON.parse(defaultErc721TransferFromAbi);
      } else {
        contractABI = JSON.parse(abi);
      }

      const data = {
        contractAddress,
        contractABI,
        method,
        args,
        chainId: ChainId?.toString,
      };

      const res = await axios.post("http://localhost:3000/executeTransaction", {
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
                  <option value={"transferFrom"}>Transfer From</option>
                  <option value={"other"}>Other</option>
                </select>
              </div>
            </div>

            {functionName !== "transferFrom" && (
              <>
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
              </>
            )}

            {functionName === "transferFrom" && (
              <div className="sm:col-span-5 sm:col-start-1 mt-3">
                <label
                  htmlFor="spender-address"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Spender Address
                </label>
                <div className="mt-2 flex justify-between">
                  <input
                    type="text"
                    name="spender-address"
                    id="spender-address"
                    onChange={(e) => setOperatorAddress(e.target.value)}
                    className="w-1/2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
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
                      className="w-1/4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
              disabled={functionName === "transferFrom" && !isApproved}
              onClick={createRawTransaction}
              className={`${
                !isApproved && functionName === "transferFrom"
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

export default Nft;
