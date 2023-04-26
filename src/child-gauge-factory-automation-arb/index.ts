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
import * as ChildGaugeFactoryJson from "../../saddle-contract/deployments/arbitrum_mainnet/ChildGaugeFactory.json";

// Entrypoint for the autotask
export async function handler(credentials: RelayerParams) {
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });
  await ethersScript(provider, signer);
}

async function getChildGaugeAddresses(
    ethcallProvider: Provider,
    childGaugeFactory: ethers.Contract,
  ): Promise<string[]> {
    const childGaugeFactoryMulticallContract = new Contract(
      ChildGaugeFactoryJson.address,
      ChildGaugeFactoryJson.abi
    );

  
    const gaugeCount = await childGaugeFactory.get_gauge_count();
    const allGaugeAddresses: Set<string> = new Set();
  
    // Use Array.from with a map function to create calls for all child gauges
    const calls = Array.from({ length: Number(gaugeCount) }, (_, i) =>
        childGaugeFactory.get_gauge(i)
    );
  
    const data: string[] = await ethcallProvider.all(calls, "latest");
    // Use forEach to add active gauge addresses to the set
    data.forEach((res) =>
      allGaugeAddresses.add(res.toString().toLowerCase())
    );
  
    console.log(`Found ${allGaugeAddresses.size} child gauges`);
    console.log(Array.from(allGaugeAddresses));

    return Array.from(allGaugeAddresses);
  }


// Call mint on all ChildGauges
export async function ethersScript(provider: BaseProvider, signer: Signer) {
    const ethCallProvider = new Provider();
    await ethCallProvider.init(provider);
  
    console.log(`Associated relayer address is: ${await signer.getAddress()}`);
  
    const childGaugeFactory = new ethers.Contract(
      ChildGaugeFactoryJson.address,
      ChildGaugeFactoryJson.abi,
      signer
    );
    
    const childGaugeAddresses = await getChildGaugeAddresses(
      ethCallProvider,
      childGaugeFactory,
    );
    
    const successfulGaugeAddresses: string[] = [];
    const failedGaugeAddresses: string[] = [];
  
    for (const gaugeAddress of childGaugeAddresses) {
      try {
        await childGaugeFactory.mint(gaugeAddress);
        successfulGaugeAddresses.push(gaugeAddress);
      } catch (error) {
        console.warn(`Failed to call mint for gauge ${gaugeAddress}`);
        console.error(error);
        failedGaugeAddresses.push(gaugeAddress);
      }
    }
    console.log(
      `Successfully called mint for ${successfulGaugeAddresses.length} gauges`
    );
    console.log(successfulGaugeAddresses);
    console.log(
      `Failed to call mint for ${failedGaugeAddresses.length} gauges`
    );
    console.log(failedGaugeAddresses);
  }