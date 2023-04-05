import * as helpers from "@nomicfoundation/hardhat-network-helpers"
import { BigNumber, Bytes, ContractFactory, providers, Signer } from "ethers"
import { ethers } from "hardhat"
import dotenv from "dotenv";
import { ALCHEMY_BASE_URL } from "./network";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export enum TIME {
  SECONDS = 1,
  DAYS = 86400,
  WEEKS = 604800,
}

export const BIG_NUMBER_1E18 = BigNumber.from(10).pow(18)
export const BIG_NUMBER_ZERO = BigNumber.from(0)

export async function setEtherBalance(
  address: string,
  amount: BigNumber,
): Promise<any> {
  await helpers.setBalance(address, amount)
}

export async function impersonateAccount(
  address: string,
): Promise<providers.JsonRpcSigner> {
  await helpers.impersonateAccount(address)
  return ethers.provider.getSigner(address)
}

export async function impersonateRelayer() {
  dotenv.config();
  // Impersonate relayer EOA
  if (!process.env.RELAYER_EOA_ADDRESS) {
    throw new Error("RELAYER_EOA_ADDRESS environment variable is not defined");
  }
  return impersonateAccount(process.env.RELAYER_EOA_ADDRESS);
}

export function getProviderUrl(chainId: string) {
  dotenv.config();
  let url = `${ALCHEMY_BASE_URL[Number.parseInt(chainId)]}`+`${process.env.ALCHEMY_API_KEY}?block_tag=${process.env.FORK_BLOCK_NUMBER}`;
  //let url = `${ALCHEMY_BASE_URL[Number.parseInt(chainId)]}`+`${process.env.ALCHEMY_API_KEY}`;
  console.log("Provider URL: ", url);
  return url;
}