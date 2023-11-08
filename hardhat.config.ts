import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import "hardhat-deploy";
import "hardhat-gas-reporter"
import "solidity-coverage";

// To find your Alchemy key, go to https://dashboard.alchemy.com/. Infure or any other provider would work here as well.
const goerliAlchemyKey = process.env.GOERLI_ALCHEMY_KEY;
// To find a private key, go to your wallet of choice and export a private key. Remember this must be kept secret at all times.
const privateKeyGoerli = process.env.GOERLI_WALLET_PRIVATE_KEY;

const mumbaiAlchemyKey = process.env.MUMBAI_ALCHEMY_KEY;
const privateKeyMumbai = process.env.MUMBAI_WALLET_PRIVATE_KEY;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${goerliAlchemyKey}`,
      accounts: [privateKeyGoerli],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${mumbaiAlchemyKey}`,
      gas: 2000,
      accounts: [privateKeyMumbai],
    },
  },
  // https://github.com/wighawag/hardhat-deploy#1-namedaccounts-ability-to-name-addresses
  namedAccounts: {
    deployer: {
      default: 0, // This value is the index in the accounts array
    },
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
