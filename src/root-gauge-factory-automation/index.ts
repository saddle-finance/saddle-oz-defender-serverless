import { ethers } from "hardhat"
import { BaseProvider } from '@ethersproject/providers';
import { DefenderRelaySigner, DefenderRelayProvider} from 'defender-relay-client/lib/ethers';
import { RelayerParams } from 'defender-relay-client/lib/relayer';
import { Signer } from 'ethers';
import { ROOT_GAUGE_FACTORY_ADDRESS } from "../../utils/accounts"
import { getActiveRootGaugeAddresses } from "../../utils/utils"
import { CHAIN_ID } from "../../utils/network";
import { RootGaugeFactory } from "../../../saddle-contract/build/typechain/";
import RootGaugeFactoryABI from "../../../saddle-contract/build/artifacts/contracts/xchainGauges/RootGaugeFactory.vy/RootGaugeFactory.json";

// Entrypoint for the autotask
export async function handler(credentials: RelayerParams) {
  // Use the credentials to initialize a DefenderRelayProvider and DefenderRelaySigner
  // They can be used as ethers.js providers and signers
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  // Run the ethers script logic with the provider and signer
  await ethersScript(provider, signer)
}

// Call transmit_emissions on all RootGauges
export async function ethersScript(provider: BaseProvider, signer: Signer) {
  console.log(`Associated relayer address is: ${await signer.getAddress()}`)

  const rootGaugeFactory = new ethers.Contract(
    ROOT_GAUGE_FACTORY_ADDRESS,
    JSON.stringify(RootGaugeFactoryABI.abi),
    signer
  );
  const rootGaugeAddresses = await getActiveRootGaugeAddresses(
    signer,
    [CHAIN_ID.ARBITRUM_MAINNET, CHAIN_ID.OPTIMISM_MAINNET]
  );
  
  for (const gaugeAddress in rootGaugeAddresses) {
    try {
      await rootGaugeFactory.connect(signer).transmit_emissions(gaugeAddress);
      console.log(`Successfully transmitted emissions for gauge ${gaugeAddress}`);
    } catch (error) {
      console.log(`Failed to transmit emissions for gauge ${gaugeAddress}`);
      console.error(error);
    }
  }
  
}
