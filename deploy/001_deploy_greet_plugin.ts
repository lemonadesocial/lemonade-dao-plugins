import { PluginRepoFactory__factory } from "@aragon/osx-ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const pluginName = "adenhall-test-plugin";
  const pluginSetupContractName = "GreetPluginSetup";
  const { deployer } = await getNamedAccounts();

  const deployedSetupContract = await deploy(pluginSetupContractName, {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true
  });

  const signer = await hre.ethers.getSigner(deployer)

  const pluginRepoFactoryAddr = "0x4E7c97ab08c046A8e43571f9839d768ae84492e4";

  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    signer
  );

  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    pluginName,
    deployedSetupContract.address,
    signer.address,
    "0x00",
    "0x00",
    { gasLimit: 10000000 }
  );

  console.log(
    `You can find the transaction address which published the ${pluginName} Plugin here: ${tx.hash}`
  );
};

export default func;
