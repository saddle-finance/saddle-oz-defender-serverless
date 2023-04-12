// External packages that should be excluded from the bundle
import { BaseProvider } from "@ethersproject/providers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import { RelayerParams } from "defender-relay-client/lib/relayer";
import { BigNumber, Signer, ethers } from "ethers";

// Custom imports that should be bundled for this autotask
import { Contract, Provider } from "ethcall";
import { CHAIN_ID } from "../../utils/network";
import * as RootGaugeFactoryJson from "../../saddle-contract/deployments/mainnet/RootGaugeFactory.json";
import * as GaugeControllerJson from "../../saddle-contract/deployments/mainnet/GaugeController.json";

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

async function getActiveRootGaugeAddresses(
  ethcallProvider: Provider,
  rootGaugeFactory: ethers.Contract,
  gaugeController: ethers.Contract,
  chainIds: string[] = [CHAIN_ID.ARBITRUM_MAINNET, CHAIN_ID.OPTIMISM_MAINNET]
): Promise<string[]> {
  const rootGaugeFactoryMulticallContract = new Contract(
    RootGaugeFactoryJson.address,
    RootGaugeFactoryJson.abi
  );

  const gaugeControllerMulticallContract = new Contract(
    GaugeControllerJson.address,
    GaugeControllerJson.abi
  );

  const calls = [];

  // get all active gauges from gauge controller
  const nGauges = await gaugeController.n_gauges();
  const allActiveGaugeAddresses: Set<string> = new Set();
  for (let i = 0; i < Number(nGauges); i++) {
    calls.push(gaugeControllerMulticallContract.gauges(i));
  }

  // Use ethcall to batch all calls
  const data: string[] = await ethcallProvider.all(calls, "latest");
  for (const res of data) {
    const gaugeAddress: string = res.toString().toLowerCase();
    allActiveGaugeAddresses.add(gaugeAddress);
  }

  console.log(`Found ${allActiveGaugeAddresses.size} active gauges`);
  console.log(Array.from(allActiveGaugeAddresses));

  // get all root gauges from root gauge factory and return if active
  const rootGaugeAddresses: Set<string> = new Set();
  for (const chainId of chainIds) {
    const gaugeCount: number = (await rootGaugeFactory.get_gauge_count(
      chainId
    ) as BigNumber).toNumber();
    console.log(
      `Found ${gaugeCount} registered root gauges for chain ${chainId}`
    );

    const calls = [];
    for (let i = 0; i < gaugeCount; i++) {
      calls.push(rootGaugeFactoryMulticallContract.get_gauge(chainId, i));
    }
    const data: string[] = await ethcallProvider.all(calls, "latest");
    for (let i = 0; i < gaugeCount; i++) {
      const gaugeAddress = data[i].toLowerCase();
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
  const ethCallProvider = new Provider();
  await ethCallProvider.init(provider);

  console.log(`Associated relayer address is: ${await signer.getAddress()}`);

  const rootGaugeFactory = new ethers.Contract(
    RootGaugeFactoryJson.address,
    RootGaugeFactoryJson.abi,
    signer
  );
  const gaugeController = new ethers.Contract(
    GaugeControllerJson.address,
    GaugeControllerJson.abi,
    signer
  );

  const rootGaugeAddresses = await getActiveRootGaugeAddresses(
    ethCallProvider,
    rootGaugeFactory,
    gaugeController,
    [CHAIN_ID.ARBITRUM_MAINNET, CHAIN_ID.OPTIMISM_MAINNET]
  );

  const successfulGaugeAddresses: string[] = [];
  const failedGaugeAddresses: string[] = [];

  for (const gaugeAddress of rootGaugeAddresses) {
    try {
      await rootGaugeFactory.transmit_emissions(gaugeAddress);
      successfulGaugeAddresses.push(gaugeAddress);
    } catch (error) {
      console.warn(`Failed to transmit emissions for gauge ${gaugeAddress}`);
      console.error(error);
      failedGaugeAddresses.push(gaugeAddress);
    }
  }
  console.log(
    `Successfully transmitted emissions for ${successfulGaugeAddresses.length} gauges`
  );
  console.log(successfulGaugeAddresses);
  console.log(
    `Failed to transmit emissions for ${failedGaugeAddresses.length} gauges (most likely because there are no emissions to transmit)`
  );
  console.log(failedGaugeAddresses);
}
