import { DAO, IDAO } from "@aragon/osx-ethers";
import { ethers } from "hardhat";
import { deployNewDAO, deployWithProxy, timestampIn } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    AdminCondition,
  AdminCondition__factory,
  ParentChildMultisig,
  ParentChildMultisig__factory,
} from "../typechain-types";
import { expect } from "chai";
import { BytesLike } from "ethers";

type MultisigSettings = {
  minApprovals: number;
  onlyListed: boolean;
};

describe("ParentChild", () => {
  let parentDAO: DAO;
  let childDAO: DAO;
  let signers: SignerWithAddress[] = [];
  let parentChildMultisig: ParentChildMultisig;
  let adminCondition: AdminCondition;
  let multisigSettings: MultisigSettings;

  // Setup a DAO
  before(async () => {
    signers = await ethers.getSigners();
    parentDAO = await deployNewDAO(signers[0]);
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
    adminCondition = await AdminConditionFactory.deploy(
      parentDAO.address
    );
    const EXECUTE_PERMISSION_ID = ethers.utils.id("EXECUTE_PERMISSION");

    await parentDAO.grant(
      adminCondition.address,
      signers[7].address,
      ethers.utils.id("DENY_PROPOSAL_PERMISSION")
    )

    await childDAO.grantWithCondition(
      childDAO.address,
      parentChildMultisig.address,
      EXECUTE_PERMISSION_ID,
      adminCondition.address,
    );
    await childDAO.grant(
      parentChildMultisig.address,
      signers[0].address,
      ethers.utils.id("UPDATE_ADDRESSES_PERMISSION"),
    );

    await childDAO.grant(
      parentChildMultisig.address,
      signers[0].address,
      ethers.utils.id("UPDATE_MULTISIG_SETTINGS_PERMISSION"),
    );
  });

  // Initialize the plugin
  beforeEach(async () => {
    await parentChildMultisig.initialize(
      childDAO.address,
      signers.slice(0, 5).map((s) => s.address),
      multisigSettings,
    );
  });

  it("should deploy", async () => {
    expect(parentChildMultisig.address).to.not.be.undefined;
  });

  it("should not allow execution if parent has denied proposal", async () => {
    const metadata: BytesLike = [];
    const actions: IDAO.ActionStruct[] = [];
    const allowFailureMap = 1;
    const approveProposal = false;
    const tryExecution = false;
    const startDate = 0;
    const endDate = await timestampIn(5000);

    const tx = await parentChildMultisig.connect(signers[0])
      .createProposal(
        metadata,
        actions,
        allowFailureMap,
        approveProposal,
        tryExecution,
        startDate,
        endDate,
      );

    await parentChildMultisig.connect(signers[0]).approve(
      tx.value.toNumber(),
      false,
    );
    // await adminCondition.connect(signers[7]).denyProposal(0);

    await expect(
      parentChildMultisig.connect(signers[0]).execute(0),
    ).to.be.revertedWithCustomError(childDAO, "Unauthorized");
  });
});
