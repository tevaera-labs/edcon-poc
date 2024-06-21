import React, { ChangeEvent, useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import {
  defaultErc20TransferAbi,
  defaultErc20TransferFromAbi,
} from "../../utils/erc20abi";
import { Contract, Provider, Wallet } from "zksync-ethers";
import { QRCode } from "react-qrcode-logo";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function ERC20() {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [functionName, setFunctionName] = useState<string>("transfer");
  const [otherFunctionName, setOtherFunctionName] = useState<string>("");

  const [abi, setAbi] = useState<string>("");
  const [otherAbi, setOtherAbi] = useState<string>("");
  const [ChainId, setChainId] = useState<number>(1);
  const [encodedData, setEncodedData] = useState<string>("");
  const [decodedData, setDecodeData] = useState<string>("");
  const [qrString, setQrSTring] = useState<string>("");
  const [inputList, setInputList] = useState([
    {
      value: "$walletAddress",
      placeHolder: "Ex: $walletAddress",
    },
    { value: "$amount", placeHolder: "$amount" },
  ]);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [spenderAddress, setSpenderAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const placeHolders = ["Ex $recipent", "Ex: $amount", "Ex: $others"];

  const accPrivateKey = process.env.NEXT_PUBLIC_OWNER_PRIVATE;

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
      const { contractAddress, contractABI, method, reward, args, argsValue } = decryptedData;
      const {amount, spender, tokenId} = argsValue
      const newargsValue = {
        amount,
        spender,
        tokenId,
      };

      const res = await axios.post("http://localhost:3000/executeTransaction", {
        walletAddress: "0xaE807e098C4bdb5e83E0629Ca49a50Bd1daa2072",
        contractAddress,
        contractABI,
        method,
        reward,
        argsValue: newargsValue,
        args
      });

      const result = res.data;
      toast.success(result);
    }catch(err : any){
      toast.error(err.message)
    }
      
  };

  const handleAddInput = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    setInputList([
      ...inputList,
      {
        value: "",
        placeHolder: placeHolders[Math.floor(Math.random() * 3)],
      },
    ]);
  };

  async function createRawTransaction(e: any) {
    e.preventDefault();

    if (!contractAddress) {
      toast.error("Contract address needs to be filled.");
      return;
    }

    try {
      let contractABI;
      let method = "";
      const args = inputList.map((input) => input.value);

      if (functionName === "other") {
        if (!otherFunctionName || !otherAbi) {
          toast.error("Make sure you fill in the contract abi , function name");
          return;
        }
        method = otherFunctionName;
        contractABI = JSON.parse(otherAbi);
      } else if (functionName === "transfer") {
        method = functionName;
        contractABI = JSON.parse(defaultErc20TransferAbi);
      } else {
        method = functionName;
        contractABI = JSON.parse(defaultErc20TransferFromAbi);
      }

      const data = {
        contractAddress,
        contractABI,
        method: functionName,
        args,
        argsValue: {
          amount,
          spender: spenderAddress,
        },
        reward: "erc20",
        chainId: ChainId?.toString,
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

  const handleInputChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const newInputList = [...inputList];
    newInputList[index].value = event.target.value;
    setInputList(newInputList);
  };

  // const ownerAddress = "0x6831b65e17b309588f8Da83861679FF85C2e8974";
  // const spenderAddress = "0x04cF2053D8bb80d9cF97f46f78627f09E383b134";

  const handleTransferFrom = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    const provider = new Provider("https://zksync-sepolia.drpc.org");
    const wallet = new Wallet(accPrivateKey as string, provider);

    const contractABI = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
    ];

    const contract = new Contract(contractAddress, contractABI, wallet);

    try {
      const isApproved = await contract.approve(spenderAddress, amount);
      if (isApproved) {
        toast.success("amount has been approved for transfer");
        setIsApproved(true);
      } else {
        toast.error("Approval did not succeed");
        setIsApproved(false);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
    setIsLoading(false);
  };

  const handleFunctionChange = async (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setFunctionName(value);

    if (value === "transfer") {
      setInputList([
        {
          value: "$walletAddress",
          placeHolder: "Ex: $walletAddress",
        },
        { value: "$amount", placeHolder: "$amount" },
      ]);
      setAbi(JSON.stringify(defaultErc20TransferAbi));
    } else if (value === "transferFrom") {
      setAbi(JSON.stringify(defaultErc20TransferFromAbi));
      setInputList([
        {
          value: "$sender",
          placeHolder: "Ex: $sender",
        },
        { value: "$recipient", placeHolder: "Ex $recipent" },
        { value: "$amount", placeHolder: "Ex $amount" },
      ]);
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
                <option value={"other"}>Other</option>
              </select>
            </div>
          </div>
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
                  onChange={(e) => setSpenderAddress(e.target.value)}
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
