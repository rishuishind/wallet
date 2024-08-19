import Image from "next/image";
import cryptoImage from "../../public/crypto.png";
import { IoLockClosedOutline } from "react-icons/io5";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex justify-center text-white items-center h-screen bg-[#A9A9A9]">
        <div className="grid grid-cols-2 gap-x-2">
          <div className="flex flex-col justify-center lg:px-5 px-3">
            <div className="flex items-center gap-x-4 mb-8">
              <span className="bg-black p-2 rounded-lg">
                <IoLockClosedOutline />
              </span>
              <span className=" font-semibold text-2xl">BlockWallet</span>
            </div>
            <div className="mb-8">
              <h1 className="text-6xl font-bold">Manage Assets</h1>
              <p className=" w-[50%] text-start">
                Securely manage blockchain assets,generate seed phrase and add
                key pairs for different blockchains
              </p>
            </div>
            <div>
              <Link href={'/generate'}>
                <button className="bg-black text-white px-4 py-2 rounded-lg">
                  Access
                </button>
              </Link>
            </div>
          </div>
          <div>
            <Image src={cryptoImage} alt="crypto-image" />
          </div>
        </div>
      </div>
    </>
  );
}
