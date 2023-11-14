import { GroupMultisig } from "../typechain-types/contracts/GroupMultisigPlugin/GroupMultisig";
import { GroupMultisig__factory } from "../typechain-types/factories/contracts/GroupMultisigPlugin";
import { deployNewDAO, deployWithProxy } from "./utils";
import { DAO } from "@aragon/osx-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

type MultisigSettings = {
  minApprovals: number;
  onlyListed: boolean;
};

describe("GroupMultisig", () => {
  let signers: SignerWithAddress[];
  let groupMultisig: GroupMultisig;
  let dao: DAO;
  let mockToken: Contract;
  let dummyActions: any;
  let dummyMetadata: string;
  let multisigSettings: MultisigSettings;

  // Setup a DAO
  before(async () => {
    signers = await ethers.getSigners();
    dummyActions = [
      {
        to: signers[0].address,
        data: "0x00000000",
        value: 0,
      },
    ];
    dummyMetadata = ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes("0x123456789")
    );

    dao = await deployNewDAO(signers[0]);
  });

  // Install the GroupMultisig to the created DAO
  beforeEach(async () => {
    multisigSettings = {
      minApprovals: 3,
      onlyListed: true,
    };

    const GroupMultisigFactory = new GroupMultisig__factory(signers[0]);
    groupMultisig = await deployWithProxy(GroupMultisigFactory);

    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TESTUSD", 100000000);

    await dao.grant(
      dao.address,
      groupMultisig.address,
      ethers.utils.id("EXECUTE_PERMISSION")
    );
    await dao.grant(
      groupMultisig.address,
      signers[0].address,
      ethers.utils.id("UPDATE_ADDRESSES_PERMISSION")
    );

    await dao.grant(
      groupMultisig.address,
      signers[0].address,
      ethers.utils.id("CREATE_GROUP_PERMISSION")
    );
  });

  // Initialize the GroupMultisig plugin
  beforeEach(async () => {
    await groupMultisig.initialize(
      dao.address,
      signers.slice(0, 5).map((s) => s.address),
      multisigSettings
    );
  })

  it("should deploy the contract", async () => {
    expect(groupMultisig.address).to.not.equal(0);
  });

  it("should create a group", async () => {
    const groupName = "MyGroup";

    await groupMultisig.createGroup(
      groupName,
      signers.slice(0, 5).map((signer) => signer.address),
      mockToken.address,
      0
    );

    // Assert that the group was created successfully
    const groupId = 0;
    expect(await groupMultisig.groupsNames(groupId)).to.equal(groupName);
  });

  it("should return true if the signer is part of the group", async () => {
    await groupMultisig.createGroup(
      "MyGroup",
      signers.slice(0, 5).map((signer) => signer.address),
      mockToken.address,
      0
    );

    expect(await groupMultisig.isMemberInGroup(signers[0].address, 0)).to.be.true;
    expect(await groupMultisig.isMemberInGroup(signers[1].address, 0)).to.be.true;
  });

  it("should return false if the signer is not part of the group", async () => {
    await groupMultisig.createGroup(
      "MyGroup",
      // Only 2 signers out of 5
      signers.slice(0, 2).map((signer) => signer.address),
      mockToken.address,
      0
    );

    expect(await groupMultisig.isMemberInGroup(signers[3].address, 0)).to.be.false;
  })
});
