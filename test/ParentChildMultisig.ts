import { DAO, IDAO } from "@aragon/osx-ethers";
import { ethers } from "hardhat";
import { deployNewDAO, deployWithProxy } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
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
  let multisigSettings: MultisigSettings;

  // Setup a DAO
  before(async () => {
    signers = await ethers.getSigners();
    parentDAO = await deployNewDAO(signers[0]);
    childDAO = await deployNewDAO(signers[0]);
  });

  beforeEach(async () => {
    multisigSettings = {
      minApprovals: 3,
      onlyListed: true,
    };

    const GroupMultisigFactory = new ParentChildMultisig__factory(signers[0]);
    parentChildMultisig = await deployWithProxy(GroupMultisigFactory);

    const AdminConditionFactory = new AdminCondition__factory(signers[0]);
    const adminCondition = await AdminConditionFactory.deploy(
      parentDAO.address,
    );

    await childDAO.grantWithCondition(
      childDAO.address,
      parentChildMultisig.address,
      ethers.utils.id("EXECUTE_PERMISSION"),
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

  // Initialize the GroupMultisig plugin
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

  it("should allow parent DAO to cancel proposals", async () => {
    const metadata: BytesLike = [];
    const actions: IDAO.ActionStruct[] = [];
    const allowFailureMap = 1;
    const approveProposal = false;
    const tryExecution = false;
    const startDate = Date.now();
    const endDate = startDate + 6000;

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

    await parentChildMultisig.connect(signers[0]).cancelProposal(tx.value);
  });
});
