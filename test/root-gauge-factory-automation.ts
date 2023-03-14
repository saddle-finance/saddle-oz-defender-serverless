import { ethersScript } from "../src/root-gauge-factory-automation";
import hre from "hardhat"

const provider = hre.ethers.provider;
const signer = hre.ethers.provider.getSigner();

describe("root-gauge-factory-automation test", () => {
  beforeEach(async () => {
    // Fork network at specific block, set up signer's funds, use impersonated signer etc
  });

  it("Successfully runs the script", async () => {
    await ethersScript(provider, signer); // Use hardhat provider and signer for testing
    // Add any assertions to check the script executed as expected.
  });
})
