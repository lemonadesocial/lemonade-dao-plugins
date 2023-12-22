import {ContractFactory, Signer} from "ethers";
import {ethers, upgrades} from "hardhat";

import {
  DAO,
  DAO__factory,
  Multisig,
  MultisigTest__factory,
} from "../typechain-types";

type DeployOptions = {
  constructurArgs?: unknown[];
  proxyType?: "uups";
};

export const daoExampleURI = "https://example.com";

// Used to deploy the implementation with the ERC1967 Proxy behind it.
// It is designed this way, because it might be desirable to avoid the OpenZeppelin upgrades package.
// In the future, this function might get replaced.
// NOTE: To avoid lots of changes in the whole test codebase, `deployWithProxy`
// won't automatically call `initialize` and it's the caller's responsibility to do so.
export async function deployWithProxy<T>(
  contractFactory: ContractFactory,
  options: DeployOptions = {},
): Promise<T> {
  // NOTE: taking this out of this file and putting this in each test file's
  // before hook seems a good idea for efficiency, though, all test files become
  // highly dependent on this package which is undesirable for now.
  upgrades.silenceWarnings();

  return upgrades.deployProxy(contractFactory, [], {
    kind: options.proxyType || "uups",
    initializer: false,
    unsafeAllow: ["constructor"],
    constructorArgs: options.constructurArgs || [],
  }) as unknown as Promise<T>;
}

export async function deployNewDAOWithMultisig(signer: Signer) {
  const daoFactory = new DAO__factory(signer);
  const multiSigFactory = new MultisigTest__factory(signer);

  const [dao, multisig, initialOwner] = await Promise.all([
    deployWithProxy<DAO>(daoFactory),
    deployWithProxy<Multisig>(multiSigFactory),
    signer.getAddress(),
  ]);

  const [daoAddress, rootPermissionId] = await Promise.all([
    dao.getAddress(),
    dao.ROOT_PERMISSION_ID(),
  ]);

  //-- init the dao with initialOwner
  await dao.initialize("0x", initialOwner, ethers.ZeroAddress, daoExampleURI);

  await multisig.initialize(daoAddress, [initialOwner], {
    minApprovals: 1,
    onlyListed: true,
  });

  //-- grant root permission to the dao, keep root permission with signer so it is able to install plugin
  await dao.grant(daoAddress, daoAddress, rootPermissionId);

  return {dao, multisig};
}
