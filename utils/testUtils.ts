import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber, Bytes, ContractFactory, providers, Signer } from "ethers";
import { ethers } from "hardhat";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export enum TIME {
  SECONDS = 1,
  DAYS = 86400,
  WEEKS = 604800,
}

export const BIG_NUMBER_1E18 = BigNumber.from(10).pow(18);
export const BIG_NUMBER_ZERO = BigNumber.from(0);

export async function setEtherBalance(
  address: string,
  amount: BigNumber
): Promise<any> {
  await helpers.setBalance(address, amount);
}

export async function impersonateAccount(
  address: string
): Promise<providers.JsonRpcSigner> {
  await helpers.impersonateAccount(address);
  return ethers.provider.getSigner(address);
}
