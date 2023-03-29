import { DEPLOYMENT_FOLDER_NAMES } from './network';
import { Contract, ContractFactory, Signer } from 'ethers';
import glob from 'glob';
import fs from 'fs';

export interface Contracts {
  [key: string]: Contract;
}

export async function getContractsFromDeployment(
  chainId: number,
  contractNameFilter = '*',
  signer?: Signer,
  provider?: any,
): Promise<Contracts> {
  const contracts: Contracts = {};
  const deploymentFolderName = DEPLOYMENT_FOLDER_NAMES[chainId];

  // Create a contract factory instance with the provided signer
  const contractFactory = signer ? new ContractFactory([], '', signer) : undefined;

  for (const contractPath of glob.sync(
    `../../saddle-contract/deployments/${deploymentFolderName}/${contractNameFilter}.json`
  )) {
    const contractName = contractPath.split('/').pop()?.split('.').shift() ?? '';
    const contractJson = JSON.parse(fs.readFileSync(contractPath, { encoding: 'utf-8' }));
    const contract = contractFactory
      ? contractFactory.attach(contractJson.address)
      : new Contract(contractJson.address, contractJson.abi, provider);
    contracts[contractName] = contract;
  }

  return contracts;
}