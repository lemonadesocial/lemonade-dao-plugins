import { expect } from "chai";
import metadata from "../contracts/ParentChildPlugin/build-metadata.json";
import {
  DAO,
  ParentChildMultisigSetup,
  ParentChildMultisigSetup__factory,
  ParentChildMultisig__factory,
} from "../typechain-types";
import { deployNewDAO } from "./utils";
import { getNamedTypesFromMetadata } from "@aragon/sdk-client-common";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

describe("ParentChildMultisigSetup", () => {
  const EMPTY_DATA = "0x";
  // Permissions
  const UPDATE_MULTISIG_SETTINGS_PERMISSION_ID = ethers.utils.id(
    "UPDATE_MULTISIG_SETTINGS_PERMISSION"
  );
  const UPGRADE_PLUGIN_PERMISSION_ID_ID = ethers.utils.id(
    "UPGRADE_PLUGIN_PERMISSION"
  );
  const EXECUTE_PERMISSION_ID = ethers.utils.id("EXECUTE_PERMISSION");

  let signers: SignerWithAddress[];
  let parentChildMultisigSetup: ParentChildMultisigSetup;
  let ParentChildMultisigFactory: ParentChildMultisig__factory;
  let implementationAddress: string;
  let targetDao: DAO;
  let parentDao: DAO;
  let minimum_data: any;

  before(async () => {
    signers = await ethers.getSigners();
    targetDao = await deployNewDAO(signers[0]);
    parentDao = await deployNewDAO(signers[7]);

    const defaultMultisigSettings = {
      onlyListed: true,
      minApprovals: 1,
    };

    minimum_data = ethers.utils.defaultAbiCoder.encode(
      getNamedTypesFromMetadata(
        metadata.pluginSetup.prepareInstallation.inputs
      ),
      [parentDao.address, [signers[0].address], Object.values(defaultMultisigSettings)]
    );

    const ParentChildMultisigSetup = new ParentChildMultisigSetup__factory(
      signers[0]
    );
    parentChildMultisigSetup = await ParentChildMultisigSetup.deploy();

    ParentChildMultisigFactory = new ParentChildMultisig__factory(signers[0]);

    implementationAddress = await parentChildMultisigSetup.implementation();
  });

  it("sets up the plugin", async () => {
    const daoAddress = targetDao.address;

    const nonce = await ethers.provider.getTransactionCount(
      parentChildMultisigSetup.address
    );
    const anticipatedPluginAddress = ethers.utils.getContractAddress({
      from: parentChildMultisigSetup.address,
      nonce,
    });

    await parentChildMultisigSetup.prepareInstallation(daoAddress, minimum_data);

    const factory = new ParentChildMultisig__factory(signers[0]);
    const parentChildMultisigContract = factory.attach(anticipatedPluginAddress);

    expect(await parentChildMultisigContract.dao()).to.eq(daoAddress);
    expect(await parentChildMultisigContract.addresslistLength()).to.be.eq(1);
    const settings = await parentChildMultisigContract.multisigSettings();
    expect(settings.onlyListed).to.be.true;
    expect(settings.minApprovals).to.eq(1);
  });
});
