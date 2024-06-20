"use client";
import { useState } from "react";
import Nft from "./Nft";
import ERC20 from "./ERC20";

export default function CreateQr() {
  const [tokenEnabled, setTokenEnabled] = useState(0);  

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
                    </select>
                  </div>
                </div>
              </div>
              {!tokenEnabled ? <ERC20 /> : <Nft />}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
