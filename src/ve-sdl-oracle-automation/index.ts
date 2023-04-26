// External packages that should be excluded from the bundle
import { BaseProvider } from "@ethersproject/providers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import { RelayerParams } from "defender-relay-client/lib/relayer";
import { Signer, ethers } from "ethers";

// Custom imports that should be bundled for this autotask
// Try to import specific functions instead of the entire package if possible
import {
  QueryParameter,
  DuneClient,
  ExecutionResult,
} from "@cowprotocol/ts-dune-client";
import { CHAIN_ID } from "../../utils/network";
import { latestUtcThursdayInUnixSeconds } from "../../utils/utils";
import * as RootOracleJson from "../../saddle-contract/deployments/mainnet/RootOracle.json";
import * as Multicall3Json from "../../saddle-contract/deployments/mainnet/Multicall3.json";
import * as VeSDLJson from "../../saddle-contract/deployments/mainnet/VotingEscrow.json";
import { Contract, Provider } from "ethcall";

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

  // Create new ethcall Provider
  const ethCallProvider = new Provider();
  await ethCallProvider.init(provider);

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

  // Use ethcall to read balances of wallets from the dune query result
  const veSDLMulticallContract = new Contract(VeSDLJson.address, VeSDLJson.abi);
  const readCalls = [];
  const walletsWithBalance = new Set();
  for (const wallet of wallets) {
    readCalls.push(veSDLMulticallContract.balanceOf(wallet));
  }

  // Only use addresses with positive veSDL balances
  const data: string[] = await ethCallProvider.all(readCalls);
  for (let i = 0; i < data.length; i++) {
    if (data[i].toString() !== "0") {
      walletsWithBalance.add(wallets[i]);
    }
  }

  // Creating a calls array, containing objects of the Call3 interface defined above.
  // Each object is a call to a RootOracle push function for a wallet and chain id combination
  interface Call3 {
    target: string;
    allowFailure: boolean;
    callData: string;
  }
  const calls: Call3[] = [];

  for (const network of [
    CHAIN_ID.ARBITRUM_MAINNET,
    CHAIN_ID.OPTIMISM_MAINNET,
  ]) {
    for (const wallet of walletsWithBalance) {
      calls.push({
        target: rootOracle.address,
        allowFailure: false,
        callData: rootOracle.interface.encodeFunctionData(
          "push(uint256,address)",
          [network, wallet]
        ),
      });
    }
  }

  // Call aggregate3 method from Multicall3 contract with the above created calls array
  await multicall3.aggregate3(calls);
  console.log("Successfully pushed new veSDL lockers to RootOracle");
  console.log(wallets);
}
