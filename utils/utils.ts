import { DEPLOYMENT_FOLDER_NAMES, CHAIN_ID } from './network';
import { ROOT_GAUGE_FACTORY_ADDRESS, GAUGE_CONTROLLER_ADDRESS } from './accounts';
import { Contract, ContractFactory, Signer} from 'ethers';
import { ethers } from "hardhat"
import { RootGaugeFactory, GaugeController } from "../../saddle-contract/build/typechain"
import rootGaugeFactoryABI from "../../saddle-contract/build/artifacts/contracts/xchainGauges/RootGaugeFactory.vy/RootGaugeFactory.json";
import gaugeControllerABI from "../../saddle-contract/build/artifacts/contracts/tokenomics/gauges/GaugeController.vy/GaugeController.json";
import glob from 'glob';
import fs from 'fs';


export interface Contracts {
  [key: string]: Contract;
}

export async function getActiveRootGaugeAddresses(
  signer: Signer,
  chainIds: string[] = [CHAIN_ID.ARBITRUM_MAINNET, CHAIN_ID.OPTIMISM_MAINNET],
): Promise<string[]> {
  const rootGaugeFactory = new ethers.Contract(
    ROOT_GAUGE_FACTORY_ADDRESS,
    JSON.stringify(rootGaugeFactoryABI.abi),
    signer
  )
  const gaugeController = new ethers.Contract(
    GAUGE_CONTROLLER_ADDRESS,
    JSON.stringify(gaugeControllerABI.abi),
    signer
  )

  // get all active gauges from gauge controller
  let nGauges = await gaugeController.n_gauges();
  let gaugeAddresses = [];
  for (let i = 0; i < Number(nGauges); i++) {
    const gaugeAddress = await gaugeController.gauges(i);
    gaugeAddresses.push(gaugeAddress);
  }

  // get all root gauges from root gauge factory and return if active
  let rootGaugeAddresses = [];
  for (const chainId in chainIds) {
    const gaugeCount = await rootGaugeFactory.get_gauge_count(chainId);
    for (let i = 0; i < Number(gaugeCount); i++) {
      const gaugeAddress = await rootGaugeFactory.get_gauge(chainId, i);
      if (gaugeAddresses.includes(gaugeAddress)) {
        rootGaugeAddresses.push(gaugeAddress);
        console.log(gaugeAddress);
      }
    }
  }
  return rootGaugeAddresses;
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