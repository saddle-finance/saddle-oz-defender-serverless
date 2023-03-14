import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv'
dotenv.config()

process.env.HARDHAT = "true"

const config: HardhatUserConfig = {
  solidity: "0.8.17",
};

export default config;
