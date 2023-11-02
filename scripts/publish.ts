import { PluginRepoFactory__factory } from "@aragon/osx-ethers";
import hardhat from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore
  const [deployer] = await hre.ethers.getSigners()

  const pluginRepoFactoryAddr = "0x4E7c97ab08c046A8e43571f9839d768ae84492e4";

  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    deployer
  );

  const pluginName = "adenhall-greeter-plugin";
  const pluginSetupContractName = "GreetPluginSetup";

  // const pluginSetupContract = await hre.ethers.getContractAt(
  //   pluginSetupContractName,
  //   deployed plugin contract address goes here (from scripts/deploy.ts)
  // );

  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    pluginName,
    '0xEEDC5043C2e5b9c25F7746e94F08F7170A11e03e', // pluginSetupContract.address
    deployer.address,
    "0x00",
    "0x00",
    { gasLimit: 1000000 }
  );

  console.log(
    `You can find the transaction address which published the ${pluginName} Plugin here: ${tx.hash}`
  );
};

func(hardhat).catch(err => console.log(err)).then(success => console.log(success));
