import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import assert from "assert";

import { bigintToBytes32, deployNewDAOWithMultisig } from "./utils";
import {
  ParentChildPluginSetupTest__factory,
  ParentChildPlugin__factory,
  MultisigTest,
  ParentChildPlugin,
} from "../typechain-types";

describe("Test", function () {
  async function deployDaos() {
    const [signer] = await ethers.getSigners();

    const [parentDAO, childDAO] = await Promise.all([
      deployNewDAOWithMultisig(signer),
      deployNewDAOWithMultisig(signer),
    ]);

    return { signer, parentDAO, childDAO };
  }

  async function deployPlugin() {
    const { signer, parentDAO, childDAO } = await deployDaos();

    const parentChildPluginSetupFactory =
      new ParentChildPluginSetupTest__factory(signer);

    const parentChildPluginSetup = await parentChildPluginSetupFactory.deploy();

    const [childAddress, childMultisigAddress, rootPermissionId] =
      await Promise.all([
        childDAO.dao.getAddress(),
        childDAO.multisig.getAddress(),
        childDAO.dao.ROOT_PERMISSION_ID(),
      ]);

    const install = async () => {
      const response = await parentChildPluginSetup.prepareInstallation(
        childAddress,
        parentChildPluginSetupFactory.interface
          .getAbiCoder()
          .encode(["address[]"], [[childMultisigAddress]]),
      );

      const receipt = await ethers.provider.getTransactionReceipt(
        response.hash,
      );

      const events = receipt?.logs.map((log) =>
        parentChildPluginSetup.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        }),
      );

      const event = events?.find(
        (event) => event?.name === "InstallationPrepared",
      );

      assert.ok(event, "InstallationPrepared event not emited");

      await childDAO.dao.applyMultiTargetPermissions(
        event.args[1].map(
          ([operation, where, who, condition, permissionId]: any[]) => ({
            operation,
            where,
            who,
            condition,
            permissionId,
          }),
        ),
      );

      const pluginAddress = event.args[0] as string;

      return ParentChildPlugin__factory.connect(pluginAddress, signer);
    };

    const uninstall = async (pluginAddress: string) => {
      const response = await parentChildPluginSetup.prepareUninstallation(
        childAddress,
        {
          plugin: pluginAddress,
          currentHelpers: [],
          data: "0x",
        },
      );

      const receipt = await ethers.provider.getTransactionReceipt(
        response.hash,
      );

      const event = receipt?.logs
        .map((log) =>
          parentChildPluginSetup.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          }),
        )
        .find((event) => event?.name === "UninstallationPrepared");

      assert.ok(event, "UninstallationPrepared event not emited");

      await childDAO.dao.applyMultiTargetPermissions(
        event.args[0].map(
          ([operation, where, who, condition, permissionId]: any[]) => ({
            operation,
            where,
            who,
            condition,
            permissionId,
          }),
        ),
      );
    };

    return { signer, parentDAO, childDAO, install, uninstall };
  }

  async function attachParent(
    childDAOMultisig: MultisigTest,
    plugin: ParentChildPlugin,
    parent: string,
    hard: boolean,
  ) {
    //-- create proposal & execute setParent
    const pluginAddress = await plugin.getAddress();

    await childDAOMultisig.createProposal(
      "0x",
      [
        {
          to: pluginAddress,
          value: 0,
          data: plugin.interface.encodeFunctionData("setParent", [
            parent,
            hard, //-- hard attach
          ]),
        },
      ],
      0,
      true,
      true,
      0,
      Math.trunc(Date.now() / 1000) + 3600,
    );
  }

  async function selfDetach(
    childDAOMultisig: MultisigTest,
    plugin: ParentChildPlugin,
  ) {
    //-- create proposal & execute setParent
    const pluginAddress = await plugin.getAddress();

    await childDAOMultisig.createProposal(
      "0x",
      [
        {
          to: pluginAddress,
          value: 0,
          data: plugin.interface.encodeFunctionData("unsetParent"),
        },
      ],
      0,
      true,
      true,
      0,
      Math.trunc(Date.now() / 1000) + 3600,
    );
  }

  async function detachChild(
    parentDAOMultisig: MultisigTest,
    plugin: ParentChildPlugin,
  ) {
    //-- create proposal & execute setParent
    const pluginAddress = await plugin.getAddress();

    await parentDAOMultisig.createProposal(
      "0x",
      [
        {
          to: pluginAddress,
          value: 0,
          data: plugin.interface.encodeFunctionData("unsetParent"),
        },
      ],
      0,
      true,
      true,
      0,
      Math.trunc(Date.now() / 1000) + 3600,
    );
  }

  it("should deploy DAOs & assign root permission to DAOs", async function () {
    const { parentDAO, childDAO } = await loadFixture(deployDaos);

    const [parent, child, rootPermissionId] = await Promise.all([
      parentDAO.dao.getAddress(),
      childDAO.dao.getAddress(),
      parentDAO.dao.ROOT_PERMISSION_ID(),
    ]);

    const [parentRoot, childRoot] = await Promise.all([
      parentDAO.dao.hasPermission(parent, parent, rootPermissionId, "0x"),
      childDAO.dao.hasPermission(child, child, rootPermissionId, "0x"),
    ]);

    assert.ok(parentRoot && childRoot);
  });

  it("should be able to install plugin", async function () {
    const { install } = await loadFixture(deployPlugin);

    const plugin = await install();

    const pluginAddress = await plugin.getAddress();

    assert.ok(ethers.isAddress(pluginAddress));
  });

  it("should be able to attach to parent dao", async function () {
    const { install, parentDAO, childDAO } = await loadFixture(deployPlugin);

    const [plugin, parentAddress] = await Promise.all([
      install(),
      parentDAO.dao.getAddress(),
    ]);

    //-- create proposal & execute setParent
    await attachParent(childDAO.multisig, plugin, parentAddress, true);

    const [currentParent, hard] = await Promise.all([
      plugin.parent(),
      plugin.hardLink(),
    ]);

    assert.ok(parentAddress === currentParent && hard);
  });

  it("should not be able to self detach in case hard link", async function () {
    const { install, parentDAO, childDAO } = await loadFixture(deployPlugin);

    const [plugin, parentAddress] = await Promise.all([
      install(),
      parentDAO.dao.getAddress(),
    ]);

    //-- attach first
    await attachParent(childDAO.multisig, plugin, parentAddress, true);

    //-- then try detach
    await expect(selfDetach(childDAO.multisig, plugin)).rejectedWith(
      "ActionFailed",
    );
  });

  it("should be able to self detach in case soft link", async function () {
    const { install, parentDAO, childDAO } = await loadFixture(deployPlugin);

    const [plugin, parentAddress] = await Promise.all([
      install(),
      parentDAO.dao.getAddress(),
    ]);

    //-- attach first
    await attachParent(childDAO.multisig, plugin, parentAddress, false);

    //-- then try detach
    await selfDetach(childDAO.multisig, plugin);

    const currentParent = await plugin.parent();

    assert.ok(currentParent === ethers.ZeroAddress);
  });

  it("should allow parent to detach", async function () {
    const { install, parentDAO, childDAO } = await loadFixture(deployPlugin);

    const [plugin, parentAddress] = await Promise.all([
      install(),
      parentDAO.dao.getAddress(),
    ]);

    //-- attach first
    await attachParent(childDAO.multisig, plugin, parentAddress, true);

    await detachChild(parentDAO.multisig, plugin);

    const currentParent = await plugin.parent();

    assert.ok(currentParent === ethers.ZeroAddress);
  });

  it("should allow arbitrary proposal", async function () {
    const { signer, install, parentDAO, childDAO } = await loadFixture(
      deployPlugin,
    );

    const [plugin, parentAddress] = await Promise.all([
      install(),
      parentDAO.dao.getAddress(),
    ]);

    //-- attach first
    await attachParent(childDAO.multisig, plugin, parentAddress, true);

    //-- create random proposal
    const response = await childDAO.multisig.createProposal(
      "0x",
      [],
      0,
      true,
      true,
      0,
      Math.trunc(Date.now() / 1000) + 3600,
    );

    const receipt = await signer.provider.getTransactionReceipt(response.hash);

    const events = receipt?.logs.map((log) =>
      childDAO.multisig.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      }),
    );

    const proposalCreated = events?.find(
      (event) => event?.name === "ProposalCreated",
    );
    const proposalExecuted = events?.find(
      (event) => event?.name === "ProposalExecuted",
    );

    assert.ok(
      proposalCreated &&
      proposalExecuted &&
      proposalCreated.args[0] === proposalExecuted.args[0],
    );
  });

  it("should reject proposal if parent intervene", async function () {
    const { signer, install, parentDAO, childDAO } = await loadFixture(
      deployPlugin,
    );

    const [plugin, parentAddress] = await Promise.all([
      install(),
      parentDAO.dao.getAddress(),
    ]);

    const pluginAddress = await plugin.getAddress();

    //-- attach first
    await attachParent(childDAO.multisig, plugin, parentAddress, true);

    //-- create random proposal, aprove but, not execute yet
    const createProposalResponse = await childDAO.multisig.createProposal(
      "0x",
      [],
      0,
      true,
      false,
      0,
      Math.trunc(Date.now() / 1000) + 3600,
    );

    const receipt = await signer.provider.getTransactionReceipt(
      createProposalResponse.hash,
    );

    const proposalCreated = receipt?.logs
      .map((log) =>
        childDAO.multisig.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        }),
      )
      ?.find((event) => event?.name === "ProposalCreated");

    const proposalId = proposalCreated?.args[0] as bigint;

    const bytes32 = bigintToBytes32(proposalId);

    //-- parent comes to intervene
    await parentDAO.multisig.createProposal(
      "0x",
      [
        {
          to: pluginAddress,
          value: 0,
          data: plugin.interface.encodeFunctionData("intervene", [
            bytes32,
            true,
          ]),
        },
      ],
      0,
      true,
      true,
      0,
      Math.trunc(Date.now() / 1000) + 3600,
    );

    //-- child try to execute the proposal
    await expect(childDAO.multisig.execute(proposalId)).rejectedWith(
      "Unauthorized",
    );
  });

  it("should deactivate plugin and transfer back root permission", async function () {
    const { install, uninstall, parentDAO, childDAO } = await loadFixture(
      deployPlugin,
    );

    const [plugin, parentAddress, childAddress, rootPermissionId] =
      await Promise.all([
        install(),
        parentDAO.dao.getAddress(),
        childDAO.dao.getAddress(),
        childDAO.dao.ROOT_PERMISSION_ID(),
      ]);

    const pluginAddress = await plugin.getAddress();

    //-- attach first
    await attachParent(childDAO.multisig, plugin, parentAddress, false);

    const rootPermissionAfterAttach = await childDAO.dao.isGranted(
      childAddress,
      childAddress,
      rootPermissionId,
      "0x",
    );

    await selfDetach(childDAO.multisig, plugin);

    //-- deactivate
    await childDAO.multisig.createProposal(
      "0x",
      [
        {
          to: pluginAddress,
          value: 0,
          data: plugin.interface.encodeFunctionData("deactivate"),
        },
      ],
      0,
      true,
      true,
      0,
      Math.trunc(Date.now() / 1000) + 3600,
    );

    const rootPermissionAfterDeactivate = await childDAO.dao.isGranted(
      childAddress,
      childAddress,
      rootPermissionId,
      "0x",
    );

    await uninstall(pluginAddress);

    assert.ok(!rootPermissionAfterAttach && rootPermissionAfterDeactivate);
  });
});
