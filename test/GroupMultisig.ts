import { GroupMultisig } from "../typechain-types/contracts/GroupMultisigPlugin/GroupMultisig";
import { GroupMultisig__factory } from "../typechain-types/factories/contracts/GroupMultisigPlugin";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { deployNewDAO } from "./utils";

describe("GroupMultisig", () => {
  let dao: Contract;
  let groupMultisig: GroupMultisig;

  beforeEach(async () => {
    // Hardhat provide us with some sample signers that simulate Ethereum accounts.
    const signers = await ethers.getSigners();
    groupMultisig = await new GroupMultisig__factory(signers[0]).deploy();
    await groupMultisig.deployed();

    dao = await deployNewDAO(signers[0].address);

    // await dao.grant(
    //     dao.address,
    //     groupMultisig.address,
    //     ethers.utils.id('EXECUTE_PERMISSION')
    // );
    // await dao.grant(
    //     groupMultisig.address,
    //     signers[0].address,
    //     ethers.utils.id('UPDATE_ADDRESSES_PERMISSION')
    // );

    // await dao.grant(
    //     groupMultisig.address,
    //     signers[0].address,
    //     ethers.utils.id('CREATE_GROUP_PERMISSION')
    // );

  });

  it("should deploy the contract", async () => {
    expect(groupMultisig.address).to.not.equal(0);
  });

  it("should create a group", async () => {
    const [owner, member1, member2] = await ethers.getSigners();
    const groupName = "MyGroup";
    const members = [member1.address, member2.address];
    const tokenAllocation = "0x123...";
    const initialAllocation = 100;

    await groupMultisig.addAddresses([
      member1.address,
      member2.address
    ])

    await groupMultisig.createGroup(
      "MyGroupTest",
      [member1.address, member2.address],
      "0x0000000000000000000000000000000000000000",
      100
    );

    // Assert that the group was created successfully
    const groupId = 0; // Assuming the first group has ID 0
    const createdGroup = JSON.parse(await groupMultisig.groups(groupId));
    expect(createdGroup.name).to.equal(groupName);
    expect(createdGroup.members).to.deep.equal(members);
    expect(createdGroup.tokenAllocation).to.equal(tokenAllocation);
    expect(createdGroup.initialAllocation).to.equal(initialAllocation);
  });
});
