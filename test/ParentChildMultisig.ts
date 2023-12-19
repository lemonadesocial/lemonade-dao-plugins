import {
  AdminCondition,
  AdminCondition__factory,
  ParentChildMultisig,
  ParentChildMultisig__factory,
} from "../typechain-types";
import { deployNewDAO, deployWithProxy, timestampIn } from "./utils";
import { DAO, IDAO, Multisig, Multisig__factory } from "@aragon/osx-ethers";
import { hexToBytes } from "@aragon/sdk-client-common";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BytesLike } from "ethers";
import { ethers } from "hardhat";

type MultisigSettings = {
  minApprovals: number;
  onlyListed: boolean;
};

describe("ParentChild", () => {
  let parentDAO: DAO;
  let childDAO: DAO;
  let signers: SignerWithAddress[] = [];
  let parentChildMultisig: ParentChildMultisig;
  let multisig: Multisig;
  let adminCondition: AdminCondition;
  let multisigSettings: MultisigSettings;

  // Setup a DAO
  before(async () => {
    signers = await ethers.getSigners();
    parentDAO = await deployNewDAO(signers[7]);
    childDAO = await deployNewDAO(signers[0]);
  });

  beforeEach(async () => {
    multisigSettings = {
      minApprovals: 1,
      onlyListed: true,
    };

    const ParentChildMultisigFactory = new ParentChildMultisig__factory(
      signers[0],
    );
    parentChildMultisig = await deployWithProxy(ParentChildMultisigFactory);

    const AdminConditionFactory = new AdminCondition__factory(signers[0]);
    adminCondition = await deployWithProxy(AdminConditionFactory);

    const multisigFactory = new ParentChildMultisig__factory(signers[7])
    multisig = await deployWithProxy(multisigFactory);

    const EXECUTE_PERMISSION_ID = ethers.utils.id("EXECUTE_PERMISSION");

    await childDAO.grant(
      parentChildMultisig.address,
      parentDAO.address,
      ethers.utils.id("DENY_PROPOSAL_PERMISSION"),
    );

    await childDAO.grantWithCondition(
      childDAO.address,
      parentChildMultisig.address,
      EXECUTE_PERMISSION_ID,
      adminCondition.address,
    );

    await parentDAO.grant(
      parentDAO.address,
      multisig.address,
      ethers.utils.id("EXECUTE_PERMISSION"),
    )
  });

  // Initialize the plugin
  beforeEach(async () => {
    await parentChildMultisig.initialize(
      childDAO.address,
      signers.slice(0, 5).map((s) => s.address),
      multisigSettings,
    );

    await multisig.initialize(
      parentDAO.address,
      signers.slice(6, 8).map((s) => s.address),
      multisigSettings
    )

    await adminCondition.initialize(parentChildMultisig.address);
  });

  it("should deploy", async () => {
    expect(parentChildMultisig.address).to.not.be.undefined;
  });

  it("should not allow execution if parent has denied a proposal", async () => {
    const metadata: BytesLike = [];
    const actions: IDAO.ActionStruct[] = [];
    const allowFailureMap = 1;
    const approveProposal = false;
    const tryExecution = false;
    const startDate = 0;
    const endDate = await timestampIn(5000);

    // Child DAO creates a proposal
    await parentChildMultisig
      .connect(signers[0])
      .createProposal(
        metadata,
        actions,
        allowFailureMap,
        approveProposal,
        tryExecution,
        startDate,
        endDate,
      );

    // Parent DAO creates a proposal to deny Child DAO's
    const parentChildInterface = ParentChildMultisig__factory.createInterface();
    const hexBytes = parentChildInterface.encodeFunctionData(
      "denyProposal",
      [0],
    );
    await multisig
      .connect(signers[7])
      .createProposal(
        metadata,
        [{
          data: hexToBytes(hexBytes),
          value: BigInt(0),
          to: parentChildMultisig.address, // Child's plugin
        }],
        allowFailureMap,
        approveProposal,
        tryExecution,
        startDate,
        endDate,
      );
    await multisig.connect(signers[7]).approve(0, true);

    expect(await parentChildMultisig.connect(signers[0]).deniedProposals(0)).to.be.true
    await expect(
      parentChildMultisig.connect(signers[0]).approve(0, true),
    ).to.be.revertedWithCustomError(childDAO, "Unauthorized");
  });
});
