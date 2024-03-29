import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "hardhat-tracer";

dotenv.config();


const config: HardhatUserConfig = {
  solidity: "0.8.17",
  mocha: {
    timeout: 1_000_000,
  },
};

export default config;
