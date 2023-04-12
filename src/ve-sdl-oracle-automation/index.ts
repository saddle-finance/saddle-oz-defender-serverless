// External packages that should be excluded from the bundle
import { BaseProvider } from "@ethersproject/providers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import { RelayerParams } from "defender-relay-client/lib/relayer";
import { Signer, ethers } from "ethers";

// Custom imports that should be bundled for this autotask
import {
  QueryParameter,
  DuneClient,
  ExecutionResult,
} from "@cowprotocol/ts-dune-client";
import { CHAIN_ID } from "../../utils/network";
import { latestUtcThursdayInUnixSeconds } from "../../utils/utils";
import * as RootOracleJson from "../../saddle-contract/deployments/mainnet/RootOracle.json";
import * as Multicall3Json from "../../saddle-contract/deployments/mainnet/Multicall3.json";

// Entrypoint for the autotask
export async function handler(credentials: RelayerParams) {
  // Creating a new instance of Defender Relay Provider using the credentials passed
  const provider = new DefenderRelayProvider(credentials);

  // Creating a new instance of Defender Relay Signer using the credentials passed and the provider created above
  const signer = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  // Call the main function ethersScript with the created provider and signer
  await ethersScript(provider, signer);
}

// https://dune.com/queries/2361886
export async function fetchNewVeSDLLockers(): Promise<ExecutionResult> {
  // Creating a new instance of DuneClient using the API key from the environment variables
  const client = new DuneClient(process.env.DUNE_API_KEY ?? "");

  // Setting up query parameters
  const queryID = 2361886;
  const parameters = [
    QueryParameter.number(
      "end_unix_timestamp",
      latestUtcThursdayInUnixSeconds()
    ),
  ];

  // Call the refresh function with the above query parameters
  return client.refresh(queryID, parameters).then((executionResult) => {
    console.log(executionResult.result);
    if (executionResult.result) {
      return executionResult.result;
    } else {
      throw new Error("Dune query result is empty");
    }
  });
}

// Main function to be called by the handler
export async function ethersScript(provider: BaseProvider, signer: Signer) {
  console.log(`Associated relayer address is: ${await signer.getAddress()}`);

  // Fetching new veSDLLockers using the fetchNewVeSDLLockers function
  const duneQueryResult = await fetchNewVeSDLLockers();

  // Extracting wallets from the rows of the received duneQueryResult
  const rows = duneQueryResult.rows;
  const wallets = rows.map((row) => row.wallet);

  // Creating a new instance of RootOracle contract with the address and ABI json objects imported from "/saddle-contract/deployments/mainnet/"
  const rootOracle = new ethers.Contract(
    RootOracleJson.address,
    RootOracleJson.abi,
    signer
  );

  // Creating a new instance of Multicall3 contract with the address and ABI json objects imported from "/saddle-contract/deployments/mainnet/"
  const multicall3 = new ethers.Contract(
    Multicall3Json.address,
    Multicall3Json.abi,
    signer
  );

  // Defining an interface for call3 objects
  interface Call3 {
    target: string;
    allowFailure: boolean;
    callData: string;
  }

  // Creating a calls array, containing objects of the Call3 interface defined above. Each object is a call to a RootOracle push function for a wallet and chain id combination
  const calls: Call3[] = [];

  for (const network of [
    CHAIN_ID.ARBITRUM_MAINNET,
    CHAIN_ID.OPTIMISM_MAINNET,
  ]) {
    for (const wallet of wallets) {
      calls.push({
        target: rootOracle.address,
        allowFailure: false,
        callData: rootOracle.interface.encodeFunctionData("push", [
          wallet,
          network,
        ]),
      });
    }
  }

  // Call aggregate3 method from Multicall3 contract with the above created calls array
  await multicall3.aggregate3(calls);
  console.log("Successfully pushed new veSDL lockers to RootOracle");
  console.log(wallets);
}
