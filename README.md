# Lemonade DAO plugins

This repository holds the plugins (smart contracts) that extend the functionalities of the DAO created with Aragon

## Deployment

Use the `deploy.ts` script and specify a network that you wish to deploy the your plugins

```shell
npx hardhat run --network goerli scripts/deploy.ts
```
**NOTES: If deploying to local `--network localhost`, ensure `npx hardhat node` is run in another terminal to open port 8545**