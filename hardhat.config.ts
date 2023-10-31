import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import "@nomicfoundation/hardhat-toolbox-viem";

// To find your Alchemy key, go to https://dashboard.alchemy.com/. Infure or any other provider would work here as well.
const goerliAlchemyKey = process.env.GOERLI_ALCHEMY_KEY;
// To find a private key, go to your wallet of choice and export a private key. Remember this must be kept secret at all times.
const privateKeyGoerli = process.env.GOERLI_WALLET_PRIVATE_KEY;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${goerliAlchemyKey}`,
      accounts: [privateKeyGoerli]
    }
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};