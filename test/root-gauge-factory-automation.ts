import chai from "chai"
import { ethersScript } from "../src/root-gauge-factory-automation";
import { ethers } from "hardhat";
import { providers } from "ethers";
import { setEtherBalance, impersonateRelayer, getProviderUrl } from "../utils/testUtils"
import { CHAIN_ID } from "../utils/network"

const { expect } = chai

describe("root-gauge-factory-automation test", () => {
  let provider: providers.JsonRpcProvider;
  let signer: providers.JsonRpcSigner;

  beforeEach(async () => { 
    provider = new ethers.providers.JsonRpcProvider(getProviderUrl(CHAIN_ID.MAINNET));
    signer = await impersonateRelayer();
    console.log("Impersonating relayer account: ", await signer.getAddress());
    await setEtherBalance(
      await signer.getAddress(),
      ethers.constants.WeiPerEther.mul(1000),
    )
  });

  it("Successfully calls transmit_emissions on root gauges", async () => {
    await ethersScript(provider, signer); 
    expect(true).to.equal(true);
  });
})
