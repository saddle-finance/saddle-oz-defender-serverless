import { DEPLOYMENT_FOLDER_NAMES } from "./network";
import { Contract, Signer } from "ethers";
import glob from "glob";
import fs from "fs";

export interface Contracts {
  [key: string]: Contract;
}

export async function getContractsFromDeployment(
  chainId: string,
  contractNameFilter = "*",
  signer?: Signer,
): Promise<Contracts> {
  const contracts: Contracts = {};
  const deploymentFolderName = DEPLOYMENT_FOLDER_NAMES[chainId];

  for (const contractPath of glob.sync(
    `../saddle-contract/deployments/${deploymentFolderName}/${contractNameFilter}.json`
  )) {
    const contractName =
      contractPath.split("/")?.pop()?.split(".")?.shift() ?? "";
    const contractJson = JSON.parse(
      await fs.promises.readFile(contractPath, { encoding: "utf-8" })
    );
    const { address, abi } = contractJson;
    const contract = new Contract(address, abi, signer);
    contracts[contractName] = contract;
  }

  return contracts;
}

export async function getFirstContractFromDeployment(
  chainId: string,
  contractNameFilter = "*",
  signer?: Signer,
): Promise<Contract | null> {
  const deploymentFolderName = DEPLOYMENT_FOLDER_NAMES[chainId];

  for (const contractPath of glob.sync(
    `../saddle-contract/deployments/${deploymentFolderName}/${contractNameFilter}.json`
  )) {
    const contractJson = JSON.parse(
      await fs.promises.readFile(contractPath, { encoding: "utf-8" })
    );
    const { address, abi } = contractJson;
    const contract = new Contract(address, abi, signer);
    return contract;
  }

  return null; // Return null if no matches are found
}

export function latestUtcThursdayInUnixSeconds(): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

  // Calculate the number of milliseconds since Thursday (00:00 UTC)
  const msSinceThursday = now % (7 * day);

  // Subtract the number of milliseconds since Thursday to get to the most recent Thursday
  return Math.floor((now - msSinceThursday) / 1000);
}