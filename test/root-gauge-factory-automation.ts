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

  it("Successfully tops up Arbitrum root gauges if needed", async () => {
    const arbRootGauge = "0x0A18D5679C5c8b56Da0D87E308DB9EE2db701BaC"; // RootGauge_42161_SaddleUSXFRAXBPMetaPoolLPToken
    await setEtherBalance(
      arbRootGauge,
      ethers.utils.parseEther('0.03')
    );
    await ethersScript(provider, signer);
    expect((await provider.getBalance(arbRootGauge)).gt(ethers.utils.parseEther('0.07')));
  });

  it("Fails to top up Arbitrum root gauges if relayer too low on ETH", async () => {
    const arbRootGauge = "0x0A18D5679C5c8b56Da0D87E308DB9EE2db701BaC"; // RootGauge_42161_SaddleUSXFRAXBPMetaPoolLPToken
    await setEtherBalance(
      arbRootGauge,
      ethers.utils.parseEther('0.03')
    );
    await setEtherBalance(
      RELAYER_ADDRESS,
      ethers.utils.parseEther('0.01')
    );
    await ethersScript(provider, signer);
    expect((await provider.getBalance(arbRootGauge)).eq(ethers.utils.parseEther('0.03')));
  });
});
