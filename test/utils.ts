import { DAO, DAO__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

type DeployOptions = {
  constructurArgs?: unknown[];
  proxyType?: "uups";
};

// Used to deploy the implementation with the ERC1967 Proxy behind it.
// It is designed this way, because it might be desirable to avoid the OpenZeppelin upgrades package.
// In the future, this function might get replaced.
// NOTE: To avoid lots of changes in the whole test codebase, `deployWithProxy`
// won't automatically call `initialize` and it's the caller's responsibility to do so.
export async function deployWithProxy<T>(
  contractFactory: ContractFactory,
  options: DeployOptions = {}
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

export const daoExampleURI = "https://example.com";

export async function deployNewDAO(signer: SignerWithAddress): Promise<DAO> {
  const DAO = new DAO__factory(signer);
  const dao = await deployWithProxy<DAO>(DAO);

  await dao.initialize(
    "0x00",
    signer.address,
    ethers.constants.AddressZero,
    daoExampleURI
  );

  return dao;
}
