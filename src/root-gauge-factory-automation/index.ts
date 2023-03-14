import { BaseProvider } from '@ethersproject/providers';
import { DefenderRelaySigner, DefenderRelayProvider} from 'defender-relay-client/lib/ethers';
import { RelayerParams } from 'defender-relay-client/lib/relayer';
import { Signer } from 'ethers';

// Entrypoint for the autotask
export async function handler(credentials: RelayerParams) {
  // Use the credentials to initialize a DefenderRelayProvider and DefenderRelaySigner
  // They can be used as ethers.js providers and signers
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
  // Run the ethers script logic with the provider and signer
  await ethersScript(provider, signer)
}

// Script logic
export async function ethersScript(provider: BaseProvider, signer: Signer) {
  console.log(`Assciated relayer address is: ${await signer.getAddress()}`)

  // TODO: Implement tx transmission logic using ethers js library
  // Use provider and signer for querying or sending txs from ethers, for example...
  // const contract = new ethers.Contract(ADDRESS, ABI, signer);
  // await contract.ping();
  console.log(`Implement me!`)
}