import { PluginRepoFactory__factory } from "@aragon/osx-ethers";
// import { ethers } from 'hardhat'
import hre from 'hardhat'

const func = async function () {
  const deployer = new hre.ethers.Wallet('896fb95c3fb55de4fe3fea4d7bbf90f657eea4b1c158adca5d8ccb30dc373d03')
  // const [deployer] = await hre.ethers.getSigners()

  const pluginRepoFactoryAddr = "0x4E7c97ab08c046A8e43571f9839d768ae84492e4";

  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    deployer
  );

  const pluginName = "adenhall-greeter-plugin";
  const pluginSetupContractName = "GreetPluginSetup";

  const pluginSetupContract = await hre.ethers.getContractAt(
    pluginSetupContractName,
    pluginRepoFactoryAddr
  );

  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    pluginName,
    pluginSetupContract.address,
    deployer.address,
    "0x00",
    "0x00"
  );

  console.log(
    `You can find the transaction address which published the ${pluginName} Plugin here: ${tx}`
  );
};

func().catch(err => console.log(err))
