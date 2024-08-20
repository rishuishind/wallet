"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { useState } from "react";
import { Wallet, HDNodeWallet } from "ethers";
import nacl from "tweetnacl";
import { Toaster, toast } from "sonner";

const page = () => {
  const [mnemonic, setMnemonic] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [solPublicKeys, setSolPublicKeys] = useState([]);
  const [ethPublicKeys, setEthPublicKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showCustomPopup, setShowCustomPopup] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [customChain, setCustomChain] = useState(60);

  const generateMnemonicStrings = async () => {
    if (mnemonic.length > 0) {
      toast.info("Seed Phrase already generated");
      return;
    }
    const mn = await generateMnemonic();
    setMnemonic(mn);
  };

  const handleWalletGeneration = async (chainType) => {
    if (!mnemonic) {
      toast.error("Generate Seed Phrase first");
      return;
    }
    const seed = await mnemonicToSeed(mnemonic);
    const derivedPath = `m/44'/${chainType}'/${currentIndex}'/0'`;
    if (chainType === 501) {
      const derivedSeed = derivePath(derivedPath, seed.toString("hex")).key;
      const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
      const keypair = Keypair.fromSecretKey(secret);
      setCurrentIndex(currentIndex + 1);
      setSolPublicKeys([...solPublicKeys, keypair.publicKey.toString()]);
    } else if (chainType === 60) {
      const hdNode = HDNodeWallet.fromSeed(seed);
      const child = hdNode.derivePath(derivedPath);
      const privateKey = child.privateKey;
      const wallet = new Wallet(privateKey);
      setCurrentIndex(currentIndex + 1);
      setEthPublicKeys([...ethPublicKeys, wallet.address]);
    }
  };

  const handleKeyClick = (key) => {
    if (selectedKey === key) {
      setSelectedKey(null);
    } else {
      setSelectedKey(key);
    }
  };

  const isValidEthAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidSolAddress = (address) => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  const checkBalance = async (key, chain) => {
    if (chain === 60) {
      if (!isValidEthAddress(key)) {
        toast.error("Invalid Ethereum address");
        return;
      }
      // Check ETH balance
      const response = await fetch("/api/eth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          params: [key, "latest"],
          method: "eth_getBalance",
        }),
      });
      const data = await response.json();
      const hexBalance = data.result;
      const weiBalance = BigInt(hexBalance);

      // Convert wei to Ether
      const etherBalance = Number(weiBalance) / 1e18;

      setBalance({ wei: weiBalance, ether: etherBalance });
      setShowPopup(true);
    } else if (chain === 501) {
      if (!isValidSolAddress(key)) {
        toast.error("Invalid Solana address");
        return;
      }
      // Check SOL balance
      const response = await fetch("/api/sol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [key],
        }),
      });
      const data = await response.json();
      const lamports = data.result.value;
      const solBalance = lamports / 1e9;
      setBalance({ lamports: lamports.toString(), sol: solBalance });
      setShowPopup(true);
    }
  };

  const handleCustomCheck = () => {
    if (!customAddress) {
      toast.error("Please enter a valid address");
      return;
    }

    if (
      (customChain === 60 && !isValidEthAddress(customAddress)) ||
      (customChain === 501 && !isValidSolAddress(customAddress))
    ) {
      toast.error(
        `Invalid ${
          customChain === 60 ? "Ethereum" : "Solana"
        } address format for the selected chain`
      );
      return;
    }

    checkBalance(customAddress, customChain);
    setShowCustomPopup(false);
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="bg-black h-screen p-3">
        {showPopup && balance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg">
              <h2 className="text-xl font-bold">Balance Details</h2>
              <p>Address: {selectedKey || customAddress}</p>
              {balance.wei !== undefined && (
                <>
                  <p>Balance in wei: {balance.wei.toString()}</p>
                  <p>Balance in Ether: {balance.ether}</p>
                </>
              )}
              {balance.sol !== undefined && (
                <>
                  <p>Balance in lamports: {balance.lamports.toString()}</p>
                  <p>Balance in SOL: {balance.sol}</p>
                </>
              )}
              <button
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showCustomPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg">
              <h2 className="text-xl font-bold">
                Check Custom Address Balance
              </h2>
              <div className="flex flex-col my-4">
                <label className="mb-2">Select Chain:</label>
                <select
                  value={customChain}
                  onChange={(e) => setCustomChain(parseInt(e.target.value))}
                  className="mb-4 p-2 border rounded"
                >
                  <option value={60}>Ethereum (ETH)</option>
                  <option value={501}>Solana (SOL)</option>
                </select>
                <label className="mb-2">Enter Address:</label>
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="mb-4 p-2 border rounded"
                />
              </div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={handleCustomCheck}
              >
                Check Balance
              </button>
              <button
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg"
                onClick={() => setShowCustomPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing content */}

        <div className="bg-[#A9A9A9] flex justify-center py-3 my-5">
          <div className="">
            <span className="text-white">Generate Seed Phrase</span>
            <div className="flex justify-center">
              <button
                onClick={generateMnemonicStrings}
                className="px-4 py-2 rounded-lg bg-white"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
        <div className="bg-[#A9A9A9] flex justify-center py-3 my-5">
          <div>
            <span className="text-white">Add Key pairs</span>
            <div className="flex justify-center gap-x-3">
              <button
                onClick={() => handleWalletGeneration(501)}
                className="px-4 py-2 rounded-lg bg-white"
              >
                Add SOL Wallet
              </button>
              <button
                onClick={() => handleWalletGeneration(60)}
                className="px-4 py-2 rounded-lg bg-white"
              >
                Add ETH Wallet
              </button>
            </div>
          </div>
        </div>
        <div className="bg-[#A9A9A9] flex flex-col justify-center py-5">
          {mnemonic && (
            <div className="w-full px-4">
              <span className="text-white text-2xl font-semibold">
                Seed Phrase
              </span>
              <div className="">
                {mnemonic.split(" ").map((word, index) => (
                  <span
                    key={index}
                    className=" bg-white text-black px-3 py-1 rounded-md mx-2"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(solPublicKeys.length > 0 || ethPublicKeys.length > 0) && (
            <div className="bg-[#DCDCDC] flex flex-col gap-y-4 mt-5 rounded-lg py-4 mx-3 justify-center">
              <div className="flex flex-col gap-y-4">
                <span className="font-semibold text-2xl flex justify-center">
                  Wallets
                </span>
                <span className="flex justify-center">Solana Wallets</span>
                <div className="flex flex-wrap justify-center gap-3">
                  {solPublicKeys.map((key, index) => (
                    <span
                      key={index}
                      onClick={() => handleKeyClick(key)}
                      className={`cursor-pointer bg-white text-black px-3 py-1 rounded-md mx-2 ${
                        selectedKey === key ? "border border-blue-500" : ""
                      }`}
                    >
                      {key}
                    </span>
                  ))}
                </div>
                <span className="flex justify-center">Ethereum Wallets</span>
                <div className="flex flex-wrap justify-center gap-3">
                  {ethPublicKeys.map((key, index) => (
                    <span
                      key={index}
                      onClick={() => handleKeyClick(key)}
                      className={`cursor-pointer bg-white text-black px-3 py-1 rounded-md mx-2 ${
                        selectedKey === key ? "border border-blue-500" : ""
                      }`}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                {selectedKey && (
                  <button
                    onClick={() =>
                      checkBalance(
                        selectedKey,
                        solPublicKeys.includes(selectedKey) ? 501 : 60
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white"
                  >
                    Check Balance
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowCustomPopup(true)}
          className="fixed bottom-4 right-4 px-4 py-2 bg-green-500 text-white rounded-full shadow-lg"
        >
          Check Balance for a Custom Address?
        </button>
      </div>
    </>
  );
};

export default page;
