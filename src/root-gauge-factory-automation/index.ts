import { ethers } from "hardhat"
import { BaseProvider } from '@ethersproject/providers';
import { DefenderRelaySigner, DefenderRelayProvider} from 'defender-relay-client/lib/ethers';
import { RelayerParams } from 'defender-relay-client/lib/relayer';
import { Signer } from 'ethers';
import RootGaugeFactoryDeployment from "../../saddle-contract/deployments/mainnet/RootGaugeFactory.json"
import { RootGaugeFactory } from "../../saddle-contract/build/typechain"
import { getContractsFromDeployment } from "../../utils/utils"
import {Contracts} from "../../utils/utils"
import { CHAIN_ID } from "../../utils/network";

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

  const rootGauges : Contracts = await getContractsFromDeployment(parseInt(CHAIN_ID.MAINNET), "RootGauge_*", signer, provider)
  const rootGaugeFactory : RootGaugeFactory = await ethers.getContractAt(
    "RootGaugeFactory",
    RootGaugeFactoryDeployment.address,
  )
  for (const rootGaugeName in rootGauges) {
    const rootGauge = rootGauges[rootGaugeName];
    await rootGaugeFactory.connect(signer).transmit_emissions(rootGauge.address);
  }
}
