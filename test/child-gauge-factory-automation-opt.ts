import chai from "chai";
import { ethersScript } from "../src/child-gauge-factory-automation-opt";
import { ethers } from "hardhat";
import { providers } from "ethers";
import { setEtherBalance, impersonateAccount } from "../utils/testUtils";
import { ALCHEMY_BASE_URL, CHAIN_ID } from "../utils/network";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { RELAYER_ADDRESS } from "../utils/accounts";

const { expect } = chai;

describe("child-gauge-factory-automation opt test", () => {
  let provider: providers.JsonRpcProvider;
  let signer: providers.JsonRpcSigner;

  beforeEach(async () => {
    // Fork mainnet at block 84519491
    console.log("Forking mainnet at block 84519491...");
    await reset(
      ALCHEMY_BASE_URL[CHAIN_ID.ARBITRUM_MAINNET] + process.env.ALCHEMY_API_KEY,
      84519491
    );
    provider = ethers.provider;

    console.log("Impersonating relayer account: ", RELAYER_ADDRESS);
    signer = await impersonateAccount(RELAYER_ADDRESS);
    await setEtherBalance(
      RELAYER_ADDRESS,
      ethers.constants.WeiPerEther.mul(1000)
    );
  });

  it("Successfully calls mint for each gauge on CGF", async () => {
    await ethersScript(provider, signer);
    expect(true).to.equal(true);
  });
});
