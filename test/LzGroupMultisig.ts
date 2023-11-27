import {
   MultiChainGroupMultisig,
   MultiChainGroupMultisig__factory
} from "../typechain-types";
import { deployNewDAO, deployWithProxy } from "./utils";
import { DAO, IDAO } from "@aragon/osx-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BytesLike, Contract } from "ethers";
import { ethers } from "hardhat";

type MultisigSettings = {
  minApprovals: number;
  onlyListed: boolean;
};

describe("LzGroupMultisig", () => {
  let signers: SignerWithAddress[];
  let daoWithL1: DAO;
  let daoWithL2: DAO;
  let l1GroupMultisig: MultiChainGroupMultisig;
  let l2GroupMultisig: MultiChainGroupMultisig;
  let mockToken: Contract;
  let lzEndpointMock: Contract;
  let multisigSettings: MultisigSettings;

  // Setup a DAO
  before(async () => {
    signers = await ethers.getSigners();

    daoWithL1 = await deployNewDAO(signers[0]);
    daoWithL2 = await deployNewDAO(signers[0]);
  });

  // Install the LzGroupMultisig to the created DAO
  beforeEach(async () => {
    const MultiChainGroupMultisigFactory = new MultiChainGroupMultisig__factory(signers[0]);
    l1GroupMultisig = await deployWithProxy<MultiChainGroupMultisig>(
      MultiChainGroupMultisigFactory
    );

    l2GroupMultisig = await deployWithProxy<MultiChainGroupMultisig>(
      MultiChainGroupMultisigFactory
    );

    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TESTUSD", 100000000);

    const LzEndpointMock = await ethers.getContractFactory("LzEndpointMock");
    lzEndpointMock = await LzEndpointMock.deploy();

    await Promise.all(
      [
        { dao: daoWithL1, groupMultisig: l1GroupMultisig },
        { dao: daoWithL2, groupMultisig: l2GroupMultisig },
      ].map(async ({ dao, groupMultisig }) => {
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
      })
    );
  });

  // Initialize the GroupMultisig plugin
  beforeEach(async () => {
    await l1GroupMultisig.initialize(
      daoWithL1.address,
      signers.slice(0, 5).map((s) => s.address),
      multisigSettings
    );

    await l2GroupMultisig.initialize(
      daoWithL2.address,
      signers.slice(0, 5).map((s) => s.address),
      multisigSettings
    );

    lzEndpointMock.setDestLzEndpoint(
      l1GroupMultisig.address,
      lzEndpointMock.address
    );
    lzEndpointMock.setDestLzEndpoint(
      l2GroupMultisig.address,
      lzEndpointMock.address
    );

    const chainId = 123;

    // set each contracts source address so it can send to each other
    l1GroupMultisig.setTrustedRemote(
      chainId,
      ethers.utils.solidityPack(
        ["address", "address"],
        [l2GroupMultisig.address, l1GroupMultisig.address]
      )
    );
    l2GroupMultisig.setTrustedRemote(
      chainId,
      ethers.utils.solidityPack(
        ["address", "address"],
        [l1GroupMultisig.address, l2GroupMultisig.address]
      )
    );
  });

  it("should create a proposal on the destination on the other end", async () => {
    const metadata: BytesLike = [];
    const actions: IDAO.ActionStruct[] = [];
    const allowFailureMap = 1;
    const approveProposal = false;
    const tryExecution = false;
    const startDate = Date.now();
    const endDate = startDate + 6000;
    await l1GroupMultisig.createMultiChainProposal(
      metadata,
      actions,
      allowFailureMap,
      approveProposal,
      tryExecution,
      startDate,
      endDate
    );
  });
});
