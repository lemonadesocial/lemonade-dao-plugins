import { GroupMultisig } from "../typechain-types/contracts/GroupMultisigPlugin/GroupMultisig";
import { GroupMultisig__factory } from "../typechain-types/factories/contracts/GroupMultisigPlugin";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployNewDAO, deployWithProxy } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DAO } from "@aragon/osx-ethers";
import { Contract } from "ethers";

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

  before(async () => {
    signers = await ethers.getSigners();
    dummyActions = [
      {
        to: signers[0].address,
        data: '0x00000000',
        value: 0,
      },
    ];
    dummyMetadata = ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes('0x123456789')
    );

    dao = await deployNewDAO(signers[0]);
  })

  beforeEach(async () => {
    multisigSettings = {
      minApprovals: 3,
      onlyListed: true,
    };

    const GroupMultisigFactory = new GroupMultisig__factory(signers[0])
    groupMultisig = await deployWithProxy(GroupMultisigFactory);

    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TESTUSD", 100000000);

    await dao.grant(
        dao.address,
        groupMultisig.address,
        ethers.utils.id('EXECUTE_PERMISSION')
    );
    await dao.grant(
        groupMultisig.address,
        signers[0].address,
        ethers.utils.id('UPDATE_ADDRESSES_PERMISSION')
    );

    await dao.grant(
        groupMultisig.address,
        signers[0].address,
        ethers.utils.id('CREATE_GROUP_PERMISSION')
    );
  });

  it("should deploy the contract", async () => {
    expect(groupMultisig.address).to.not.equal(0);
  });

  it("should create a group", async () => {
    const groupName = "MyGroup";

    await groupMultisig.initialize(
      dao.address,
      signers.slice(0, 5).map(s => s.address),
      multisigSettings
    );

    await groupMultisig.createGroup(
      groupName,
      signers.slice(0, 5).map(signer => signer.address),
      mockToken.address,
      0
    );

    // Assert that the group was created successfully
    const groupId = 0;
    expect(await groupMultisig.groupsNames(groupId)).to.equal(groupName)
  });
});
