import { GroupMultisigBase } from "../typechain-types/contracts/GroupMultisigPlugin/GroupMultisigBase";
import { GroupMultisigBase__factory } from "../typechain-types/factories/contracts/GroupMultisigPlugin";
import { deployNewDAO, deployWithProxy } from "./utils";
import { DAO, IDAO } from "@aragon/osx-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BytesLike, Contract } from "ethers";
import { ethers } from "hardhat";

type MultisigSettings = {
  minApprovals: number;
  onlyListed: boolean;
};

describe("GroupMultisigBase", () => {
  let signers: SignerWithAddress[];
  let groupMultisig: GroupMultisigBase;
  let dao: DAO;
  let mockToken: Contract;
  let dummyActions: any;
  let dummyMetadata: string;
  let multisigSettings: MultisigSettings;
  const groupId = 0;

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

    const GroupMultisigFactory = new GroupMultisigBase__factory(signers[0]);
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

    await dao.grant(
      groupMultisig.address,
      signers[0].address,
      ethers.utils.id("UPDATE_MULTISIG_SETTINGS_PERMISSION")
    );
  });

  // Initialize the GroupMultisig plugin
  beforeEach(async () => {
    await groupMultisig.initialize(
      dao.address,
      signers.slice(0, 5).map((s) => s.address),
      multisigSettings
    );
  });

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
    expect(await groupMultisig.groupsNames(groupId)).to.equal(groupName);
  });

  describe("Members:", () => {
    it("should return true if the signer is part of the group", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 5).map((signer) => signer.address),
        mockToken.address,
        0
      );

      expect(await groupMultisig.isMemberInGroup(signers[0].address, groupId))
        .to.be.true;
      expect(await groupMultisig.isMemberInGroup(signers[1].address, groupId))
        .to.be.true;
    });

    it("should return false if the signer is not part of the group", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        // Only 3 signers out of 5
        signers.slice(0, 2).map((signer) => signer.address),
        mockToken.address,
        0
      );

      // Check signer #4
      expect(await groupMultisig.isMemberInGroup(signers[3].address, groupId))
        .to.be.false;
    });

    it("should add members to the group", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 1).map((signer) => signer.address),
        mockToken.address,
        0
      );
      expect(await groupMultisig.isMemberInGroup(signers[1].address, groupId))
        .to.be.false;

      await groupMultisig.addAddressesToGroup([signers[1].address], groupId);

      expect(await groupMultisig.isMemberInGroup(signers[1].address, groupId))
        .to.be.true;
    });

    it("should remove members from the group", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 3).map((signer) => signer.address),
        mockToken.address,
        0
      );
      expect(await groupMultisig.isMemberInGroup(signers[1].address, groupId))
        .to.be.true;

      await groupMultisig.removeAddressesFromGroup(
        [signers[1].address],
        groupId
      );

      expect(await groupMultisig.isMemberInGroup(signers[1].address, groupId))
        .to.be.false;
    });

    it("should add members to DAO but not in a group", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 5).map((signer) => signer.address),
        mockToken.address,
        0
      );
      expect(await groupMultisig.isMemberInGroup(signers[6].address, groupId))
        .to.be.false;
      expect(await groupMultisig.isMember(signers[6].address)).to.be.false;

      await groupMultisig.addAddresses([signers[6].address]);

      expect(await groupMultisig.isMember(signers[6].address)).to.be.true;
      expect(await groupMultisig.isMemberInGroup(signers[6].address, groupId))
        .to.be.false;
    });

    it("should remove members from DAO but not in group", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 5).map((signer) => signer.address),
        mockToken.address,
        0
      );
      expect(await groupMultisig.isMemberInGroup(signers[3].address, groupId))
        .to.be.true;

      await groupMultisig.removeAddresses([signers[3].address]);

      expect(await groupMultisig.isMemberInGroup(signers[3].address, groupId))
        .to.be.true;
      expect(await groupMultisig.isMember(signers[3].address)).to.be.false;
    });
  });

  describe("Proposal:", () => {
    it("should create a new proposal for that group", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 5).map((signer) => signer.address),
        mockToken.address,
        0
      );

      await groupMultisig.createGroup(
        "MyGroup2",
        signers.slice(0, 5).map((signer) => signer.address),
        mockToken.address,
        0
      );

      const metadata: BytesLike = [];
      const actions: IDAO.ActionStruct[] = [];
      const allowFailureMap = 1;
      const approveProposal = false;
      const tryExecution = false;
      const startDate = Date.now();
      const endDate = startDate + 6000;

      const tx = await groupMultisig.connect(signers[0]).createProposal(
        metadata,
        actions,
        allowFailureMap,
        approveProposal,
        tryExecution,
        startDate,
        endDate,
        1 // Second group
      );

      expect(tx).to.emit(groupMultisig, "ProposalCreated");
      expect(await groupMultisig.groupProposal(0)).to.equal(1); // Belongs to second group
    });

    it("should not create a proposal if not a member", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 2).map((signer) => signer.address),
        mockToken.address,
        0
      );

      const metadata: BytesLike = [];
      const actions: IDAO.ActionStruct[] = [];
      const allowFailureMap = 1;
      const approveProposal = false;
      const tryExecution = false;
      const startDate = Date.now();
      const endDate = startDate + 6000;

      await expect(
        groupMultisig
          .connect(signers[3])
          .createProposal(
            metadata,
            actions,
            allowFailureMap,
            approveProposal,
            tryExecution,
            startDate,
            endDate,
            groupId
          )
      ).to.be.reverted;
    });

    it("should not approve a proposal if not a member", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 2).map((signer) => signer.address),
        mockToken.address,
        0
      );

      const metadata: BytesLike = [];
      const actions: IDAO.ActionStruct[] = [];
      const allowFailureMap = 1;
      const approveProposal = false;
      const tryExecution = false;
      const startDate = Date.now();
      const endDate = startDate + 6000;

      await groupMultisig
        .connect(signers[0])
        .createProposal(
          metadata,
          actions,
          allowFailureMap,
          approveProposal,
          tryExecution,
          startDate,
          endDate,
          groupId
        );

      expect(
        await groupMultisig
          .connect(signers[3])
          .canApprove(groupMultisig.groupProposal(groupId), signers[3].address)
      ).to.be.false;

      await expect(
        groupMultisig
          .connect(signers[3])
          .approve(groupMultisig.groupProposal(groupId), false)
      ).to.be.revertedWithCustomError(groupMultisig, "ApprovalCastForbidden");
    });

    it("should approve proposal if user is a member", async () => {
      await groupMultisig.createGroup(
        "MyGroup",
        signers.slice(0, 2).map((signer) => signer.address),
        mockToken.address,
        0
      );

      const metadata: BytesLike = [];
      const actions: IDAO.ActionStruct[] = [];
      const allowFailureMap = 1;
      const approveProposal = false;
      const tryExecution = false;
      const startDate = Date.now();
      const endDate = startDate + 6000;

      await groupMultisig
        .connect(signers[0])
        .createProposal(
          metadata,
          actions,
          allowFailureMap,
          approveProposal,
          tryExecution,
          startDate,
          endDate,
          groupId
        );

      expect(
        await groupMultisig
          .connect(signers[1])
          .canApprove(groupMultisig.groupProposal(groupId), signers[1].address)
      ).to.be.true;

      await groupMultisig
        .connect(signers[1])
        .approve(groupMultisig.groupProposal(groupId), true);
    })
  });

  describe("Vault:", () => {
    it("should allow only members to withdraw", async () => {
      const allowedAddress = signers[0].address;
      const destinationAddress = signers[2].address;

      await groupMultisig.createGroup(
        "MyGroup",
        [allowedAddress],
        mockToken.address,
        0
      );

      const groupVaultAddress = await groupMultisig.getGroupVault(groupId);

      await mockToken.transfer(groupVaultAddress, 100);

      await expect(
        groupMultisig
          .connect(signers[1])
          .withdrawERC20(mockToken.address, 100, destinationAddress, 0)
      ).to.be.revertedWith("Not a group member");

      await groupMultisig
        .connect(signers[0])
        .withdrawERC20(mockToken.address, 100, destinationAddress, 0);

      expect(await mockToken.balanceOf(destinationAddress)).to.be.equals(100);
    });
  });
});
