import { SubDAOCreator, SubDAOCreator__factory } from "../typechain-types";
import {
  createPrepareInstallationParams,
  daoExampleURI,
  deployNewDAO,
  deployWithProxy,
} from "./utils";
import { DAO, activeContractsList } from "@aragon/osx-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SubDAOCreator", () => {
  let signers: SignerWithAddress[];
  let subDAOCreator: SubDAOCreator;
  let dao: DAO;

  // Setup a DAO
  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployNewDAO(signers[0]);
  });

  // Install the plugin to the DAO
  beforeEach(async () => {
    const SubDAOCreatorFactory = new SubDAOCreator__factory(signers[0]);
    subDAOCreator = await deployWithProxy(SubDAOCreatorFactory);

    await dao.grant(
      dao.address,
      subDAOCreator.address,
      ethers.utils.id("EXECUTE_PERMISSION")
    );

    await dao.grant(
      subDAOCreator.address,
      signers[0].address,
      ethers.utils.id("CREATE_SUBDAO_PERMISSION")
    );
  });

  beforeEach(async () => {
    await subDAOCreator.initialize(dao.address);
  });

  it("should deploy the subdao", async () => {
    expect(subDAOCreator.address).to.not.eq(0);
  });

  it("should create a DAO", async () => {
    const pluginSetupMockRepoAddress = ethers.constants.AddressZero;
    const pluginInstallationData = createPrepareInstallationParams(
      [pluginSetupMockRepoAddress, 1, 1],
      "0x"
    );
    await subDAOCreator.createSubDao(
      {
        daoURI: daoExampleURI,
        metadata: "0x0000",
        subdomain: "my-dao",
        trustedForwarder: ethers.constants.AddressZero,
      },
      [pluginInstallationData]
    );
  });
});
