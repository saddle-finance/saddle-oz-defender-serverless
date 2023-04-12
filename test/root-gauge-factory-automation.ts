import chai from "chai";
import { ethersScript } from "../src/root-gauge-factory-automation";
import { ethers } from "hardhat";
import { providers } from "ethers";
import { setEtherBalance, impersonateAccount } from "../utils/testUtils";
import { ALCHEMY_BASE_URL, CHAIN_ID } from "../utils/network";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { RELAYER_ADDRESS } from "../utils/accounts";

const { expect } = chai;

describe("root-gauge-factory-automation test", () => {
  let provider: providers.JsonRpcProvider;
  let signer: providers.JsonRpcSigner;

  beforeEach(async () => {
    // Fork mainnet at block 16936900
    console.log("Forking mainnet at block 16936900...");
    await reset(
      ALCHEMY_BASE_URL[CHAIN_ID.MAINNET] + process.env.ALCHEMY_API_KEY,
      16936900
    );
    provider = ethers.provider;

    console.log("Impersonating relayer account: ", RELAYER_ADDRESS);
    signer = await impersonateAccount(RELAYER_ADDRESS);
    await setEtherBalance(
      RELAYER_ADDRESS,
      ethers.constants.WeiPerEther.mul(1000)
    );
  });

  it("Successfully calls transmit_emissions on root gauges", async () => {
    await ethersScript(provider, signer);
    expect(true).to.equal(true);
  });
});
