import releaseMetadata from "../contracts/ParentChildPlugin/release-metadata.json";
import buildMetadata from "../contracts/ParentChildPlugin/build-metadata.json";
import { toHex, uploadToIPFS } from "../utils/ipfs-upload";
import { PluginRepoFactory__factory } from "@aragon/osx-ethers";
import { activeContractsList } from "@aragon/osx-ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const pluginName = "adenhall-subdao-test";
  const pluginSetupContractName = "ParentChildMultisigSetup";
  const { deployer } = await getNamedAccounts();

  const deployedSetupContract = await deploy(pluginSetupContractName, {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const signer = await hre.ethers.getSigner(deployer);

  // const pluginRepoFactoryAddr = "0x4E7c97ab08c046A8e43571f9839d768ae84492e4";
  const pluginRepoFactoryAddr = activeContractsList.mumbai.PluginRepoFactory;

  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    signer
  );

  // Upload the metadata
  const releaseMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(releaseMetadata),
    true // for testing
  )}`;
  const buildMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(buildMetadata),
    true // for testing
  )}`;

  console.log(`Uploaded metadata of release 1: ${releaseMetadataURI}`);
  console.log(`Uploaded metadata of build 1: ${buildMetadataURI}`);

  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    pluginName,
    deployedSetupContract.address,
    signer.address,
    toHex(releaseMetadataURI),
    toHex(buildMetadataURI),
    { gasLimit: 1000000 }
  );

  console.log(
    `You can find the transaction address which published the ${pluginName} Plugin here: ${tx.hash}`
  );
  console.log("Returned: ", tx.value);
};

export default func;
