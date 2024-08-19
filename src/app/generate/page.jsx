"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { useState } from "react";
import { Wallet, HDNodeWallet } from "ethers";
import nacl from "tweetnacl";

const page = () => {
  const [mnemonic, setMnemonic] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [solPublicKeys, setSolPublicKeys] = useState([]);
  const [ethPublicKeys, setEthPublicKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const generateMnemonicStrings = async () => {
    if (mnemonic.length > 0) {
      alert("Seed Phrase already generated");
      return;
    }
    const mn = await generateMnemonic();
    setMnemonic(mn);
  };

  const handleWalletGeneration = async (chainType) => {
    if (!mnemonic) {
      alert("Generate Seed Phrase first");
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

  const checkBalance = async (key, chain) => {
    if (chain === 60) {
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
    }
    if (chain === 501) {
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
      const solBalance = lamports / 1e9; // Convert lamports to SOL (1 SOL = 1e9 lamports)
      setBalance({ lamports: lamports.toString(), sol: solBalance });
      setShowPopup(true);
    }
  };

  return (
    <div className="bg-black h-screen p-3">
      {showPopup && balance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold">Balance Details</h2>
            <p>Address: {selectedKey}</p>
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
          <div className="w-full px-4">
            <span className="text-white text-2xl font-semibold">
              Public Keys
            </span>
            <p>Click on the public keys for other options:</p>
            <div className="">
              {solPublicKeys.length > 0 && (
                <div className="flex flex-wrap gap-y-3 my-5 bg-black p-2 rounded-md">
                  <span className="text-white text-xl">SOL Public Keys</span>
                  {solPublicKeys.map((key, index) => (
                    <div key={index} className="flex flex-col">
                      <span
                        onClick={() => handleKeyClick(key)}
                        className={`cursor-pointer bg-white text-black px-3 py-1 rounded-md mx-2 ${
                          selectedKey === key ? "bg-gray-400" : ""
                        }`}
                      >
                        {key}
                      </span>
                      {selectedKey === key && (
                        <button
                          className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-lg"
                          onClick={() => checkBalance(key, 501)}
                        >
                          Check Balance
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {ethPublicKeys.length > 0 && (
                <div className="flex flex-wrap gap-y-3 my-5 bg-black p-2 rounded-md">
                  <span className="text-white text-xl">ETH Public Keys</span>
                  {ethPublicKeys.map((key, index) => (
                    <div key={index} className="flex flex-col">
                      <span
                        onClick={() => handleKeyClick(key)}
                        className={`cursor-pointer bg-white text-black px-3 py-1 rounded-md mx-2 ${
                          selectedKey === key ? "bg-gray-400" : ""
                        }`}
                      >
                        {key}
                      </span>
                      {selectedKey === key && (
                        <button
                          className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-lg"
                          onClick={() => checkBalance(key, 60)}
                        >
                          Check Balance
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
