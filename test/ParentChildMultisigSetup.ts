import { expect } from "chai";
import metadata from "../contracts/ParentChildPlugin/build-metadata.json";
import {
  DAO,
  ParentChildMultisigSetup,
  ParentChildMultisigSetup__factory,
  ParentChildMultisig__factory,
} from "../typechain-types";
import { deployNewDAO } from "./utils";
import { getNamedTypesFromMetadata, PermissionOperationType } from "@aragon/sdk-client-common";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

describe("ParentChildMultisigSetup", () => {
  const AddressZero = ethers.constants.AddressZero;
  // Permissions
  const UPDATE_MULTISIG_SETTINGS_PERMISSION_ID = ethers.utils.id(
    "UPDATE_MULTISIG_SETTINGS_PERMISSION"
  );
  const UPGRADE_PLUGIN_PERMISSION_ID_ID = ethers.utils.id(
    "UPGRADE_PLUGIN_PERMISSION"
  );
  const EXECUTE_PERMISSION_ID = ethers.utils.id("EXECUTE_PERMISSION");
  const DENY_PROPOSAL_PERMISSION_ID = ethers.utils.id("DENY_PROPOSAL_PERMISSION");
  const ROOT_PERMISSION_ID = ethers.utils.id("ROOT_PERMISSION");

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

  it('returns the plugin, helpers, and permissions', async () => {
    const nonce = await ethers.provider.getTransactionCount(
      parentChildMultisigSetup.address
    );
    const anticipatedPluginAddress = ethers.utils.getContractAddress({
      from: parentChildMultisigSetup.address,
      nonce,
    });

    const {
      plugin,
      preparedSetupData: {helpers, permissions},
    } = await parentChildMultisigSetup.callStatic.prepareInstallation(
      targetDao.address,
      minimum_data
    );
    const adminConditionAddr = helpers[0];

    expect(plugin).to.be.equal(anticipatedPluginAddress);
    expect(helpers.length).to.be.equal(1); // Admin Condition in here
    expect(permissions.length).to.be.equal(6);
    expect(permissions).to.deep.equal([
      [
        PermissionOperationType.GRANT,
        plugin,
        targetDao.address,
        AddressZero,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
      ],
      [
        PermissionOperationType.GRANT,
        plugin,
        targetDao.address,
        AddressZero,
        UPGRADE_PLUGIN_PERMISSION_ID_ID,
      ],
      [
        PermissionOperationType.GRANT,
        plugin,
        parentDao.address,
        AddressZero,
        DENY_PROPOSAL_PERMISSION_ID,
      ],
      [
        PermissionOperationType.GRANT,
        targetDao.address,
        plugin,
        adminConditionAddr,
        EXECUTE_PERMISSION_ID,
      ],
      [
        PermissionOperationType.GRANT,
        targetDao.address,
        parentDao.address,
        AddressZero,
        ROOT_PERMISSION_ID,
      ],
      [
        PermissionOperationType.REVOKE,
        targetDao.address,
        targetDao.address,
        AddressZero,
        ROOT_PERMISSION_ID,
      ]
    ]);
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

    const parentChildMultisigContract = ParentChildMultisigFactory.attach(anticipatedPluginAddress);

    expect(await parentChildMultisigContract.dao()).to.eq(daoAddress);
    expect(await parentChildMultisigContract.addresslistLength()).to.be.eq(1);
    const settings = await parentChildMultisigContract.multisigSettings();
    expect(settings.onlyListed).to.be.true;
    expect(settings.minApprovals).to.eq(1);
  });
});
