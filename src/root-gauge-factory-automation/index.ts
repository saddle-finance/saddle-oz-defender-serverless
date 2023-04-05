import { BaseProvider } from "@ethersproject/providers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import { RelayerParams } from "defender-relay-client/lib/relayer";
import { BigNumber, Signer, ethers } from "ethers";

// Entrypoint for the autotask
export async function handler(credentials: RelayerParams) {
  // Use the credentials to initialize a DefenderRelayProvider and DefenderRelaySigner
  // They can be used as ethers.js providers and signers
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });
  // Run the ethers script logic with the provider and signer
  await ethersScript(provider, signer);
}

// Importing from other source files is not supported with default typescript builds
// Would need a module loader like webpack or rollup to support this
// Until then, constants and helper functions need to be defined within index.ts to prevent compilation errors
const ROOT_GAUGE_FACTORY_ADDRESS = "0x19a5Ec09eE74f64573ac53f48A48616CE943C047";
const ROOT_GAUGE_FACTORY_ABI = [
  "function transmit_emissions(address gauge) external",
  "function get_gauge_count(uint256 chain_id) external view returns (uint256)",
  "function get_gauge(uint256 chain_id, uint256 index) external view returns (address)",
];
const GAUGE_CONTROLLER_ADDRESS = "0x99Cb6c36816dE2131eF2626bb5dEF7E5cc8b9B14";
const GAUGE_CONTROLLER_ABI = [
  "function n_gauges() external view returns (uint256)",
  "function gauges(uint256) external view returns (address)",
];

enum CHAIN_ID {
  ARBITRUM_MAINNET = "42161",
  OPTIMISM_MAINNET = "10",
}

async function getActiveRootGaugeAddresses(
  signer: Signer,
  chainIds: string[] = [CHAIN_ID.ARBITRUM_MAINNET, CHAIN_ID.OPTIMISM_MAINNET]
): Promise<string[]> {
  const rootGaugeFactory = new ethers.Contract(
    ROOT_GAUGE_FACTORY_ADDRESS,
    ROOT_GAUGE_FACTORY_ABI,
    signer
  );
  const gaugeController = new ethers.Contract(
    GAUGE_CONTROLLER_ADDRESS,
    GAUGE_CONTROLLER_ABI,
    signer
  );

  // get all active gauges from gauge controller
  let nGauges = await gaugeController.n_gauges();
  let allActiveGaugeAddresses: Set<string> = new Set();
  for (let i = 0; i < Number(nGauges); i++) {
    const gaugeAddress: string = (
      (await gaugeController.gauges(i)) as string
    ).toLowerCase();
    allActiveGaugeAddresses.add(gaugeAddress);
  }
  console.log(`Found ${allActiveGaugeAddresses.size} active gauges`);
  console.log(Array.from(allActiveGaugeAddresses));

  // get all root gauges from root gauge factory and return if active
  let rootGaugeAddresses: Set<string> = new Set();
  for (const chainId of chainIds) {
    const gaugeCount: BigNumber = await rootGaugeFactory.get_gauge_count(
      chainId
    );
    console.log(
      `Found ${gaugeCount.toNumber()} registered root gauges for chain ${chainId}`
    );
    for (let i = 0; i < gaugeCount.toNumber(); i++) {
      const gaugeAddress = (
        (await rootGaugeFactory.get_gauge(chainId, i)) as string
      ).toLowerCase();
      if (!rootGaugeAddresses.has(gaugeAddress)) {
        if (allActiveGaugeAddresses.has(gaugeAddress)) {
          rootGaugeAddresses.add(gaugeAddress);
          console.log(
            `${gaugeAddress} is a registered root gauge for chain ${chainId}`
          );
        } else {
          console.log(
            `${gaugeAddress} is is an UNREGISTERED root gauge for chain ${chainId}`
          );
        }
      }
    }
  }
  return Array.from(rootGaugeAddresses);
}

// Call transmit_emissions on all RootGauges
export async function ethersScript(provider: BaseProvider, signer: Signer) {
  console.log(`Associated relayer address is: ${await signer.getAddress()}`);

  const rootGaugeFactory = new ethers.Contract(
    ROOT_GAUGE_FACTORY_ADDRESS,
    ROOT_GAUGE_FACTORY_ABI,
    signer
  );
  const rootGaugeAddresses = await getActiveRootGaugeAddresses(signer, [
    CHAIN_ID.ARBITRUM_MAINNET,
    CHAIN_ID.OPTIMISM_MAINNET,
  ]);

  const successfulGaugeAddresses: string[] = [];
  const failedGaugeAddresses: string[] = [];
  for (const gaugeAddress of rootGaugeAddresses) {
    try {
      await rootGaugeFactory.connect(signer).transmit_emissions(gaugeAddress);
      successfulGaugeAddresses.push(gaugeAddress);
    } catch (error) {
      console.warn(
        `Failed to transmit emissions for gauge ${gaugeAddress}. Most likely because there are no emissions to transmit.`
      );
      console.error(error);
      failedGaugeAddresses.push(gaugeAddress);
    }
  }
  console.log(
    `Successfully transmitted emissions for ${successfulGaugeAddresses.length} gauges`
  );
  console.log(successfulGaugeAddresses);
  console.log(
    `Failed to transmit emissions for ${failedGaugeAddresses.length} gauges`
  );
  console.log(failedGaugeAddresses);
}
