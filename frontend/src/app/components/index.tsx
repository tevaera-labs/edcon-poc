"use client";
import { useEffect, useState } from "react";
import ERC20 from "./ERC20";
import ERC721 from "./ERC721";
import ERC1155 from "./ERC1155";


interface CustomWindow extends Window {
  ethereum?: any; // Define the ethereum property with any type or specify a more specific type if available
}
declare let window: CustomWindow;

export default function CreateQr() {
  const [tokenEnabled, setTokenEnabled] = useState(0); 
  const [walletAddress, setWalletAddress] = useState<string>('');
 

  useEffect(()=>{
    const connectWallet = async () => {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
          // Requesting Ethereum accounts
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          // Checking if accounts are available
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            console.log(accounts)
          } else {
            console.error('No accounts found.');
          }
        } catch (error) {
          console.error('Error connecting to MetaMask:', error);
        }
      } else {
        alert('MetaMask is not installed or not yet initialized. Please ensure MetaMask is installed and try again.');
      }
    };
    connectWallet()
  },[walletAddress])

  return (
    <div className="container mx-auto px-8">
      <div className="form-container">
        <div className="w-full row-span-12 mt-8">
          <form className="ps-4">
            <div className="space-y-12 flex flex-col">
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="text-base font-semibold leading-7 text-gray-900">
                  Profile
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  This information will be displayed publicly so be careful what
                  you share.
                </p>

                <div className="sm:col-span-full mt-10">
                  <h2 className="text-base font-semibold leading-7 text-gray-900">
                    Choose reward
                  </h2>
                  <div className="mt-2">
                    <select
                      onChange={(e) => setTokenEnabled(Number(e.target.value))}
                      className="text-black rounded-md"
                    >
                      <option value={0}>ERC 20</option>
                      <option value={1}>ERC 721</option>
                      <option value={2}>ERC 1155</option>
                    </select>
                  </div>
                </div>
              </div>
              { tokenEnabled === 0 ? <ERC20 walletAddress={walletAddress} /> : tokenEnabled === 1 ? <ERC721 walletAddress={walletAddress}/>: <ERC1155 walletAddress={walletAddress}/>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
