import { formatEther, parseEther } from "viem";
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();

  console.log(
    `Deploying contracts with the account: ${deployer.account.address}`,
  );

  const greet = await hre.viem.deployContract("GreetPluginSetup");

  console.log(`Greet deployed to ${greet.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
