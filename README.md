# Lemonade DAO plugins

This repository holds the plugins (smart contracts) that extend the functionalities of the DAO created with Aragon

## Stack

- [Hardhat](https://github.com/nomiclabs/hardhat): compile, run and test smart contracts
- [Solhint](https://github.com/protofire/solhint): code linter
- [Solcover](https://github.com/sc-forks/solidity-coverage): code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter

## Deployment

Use the `deploy.ts` script and specify a network that you wish to deploy the your plugins

```shell
npx hardhat run --network goerli scripts/deploy.ts
```

**NOTES: If deploying to local `--network localhost`, ensure `npx hardhat node` is run in another terminal to open port 8545**
