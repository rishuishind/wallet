// /pages/api/proxy/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("Handling POST request for sol");

  const response = await fetch(
    "https://solana-mainnet.g.alchemy.com/v2/jOkpWN1RUb0W5Gdwih8CGOhRmpJf64yc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any additional headers here
      },
      body: req.body,
      duplex: "half", // Required for handling the request body in Node.js environments
    }
  );

  const data = await response.json();
  console.log("data is", data);
  return NextResponse.json(data);
}

// Example for handling GET requests
// export async function GET(req) {
//   // Your GET request handling logic here
// }
