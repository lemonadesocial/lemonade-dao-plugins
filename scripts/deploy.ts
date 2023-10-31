import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const getGreeterSetup = await ethers.getContractFactory("GreetPluginSetup");
  const GreeterSetup = await getGreeterSetup.deploy();

  console.log("GreeterSetup deployed to:", GreeterSetup.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
