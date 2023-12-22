import {loadFixture} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import {ethers} from "hardhat";
import assert from "assert";

import {deployNewDAOWithMultisig} from "./utils";
import {
  ParentChildPluginSetupTest__factory,
  ParentChildPlugin__factory,
} from "../typechain-types";

describe("Test", function () {
  async function deployDaos() {
    const [signer] = await ethers.getSigners();

    const [parentDAO, childDAO] = await Promise.all([
      deployNewDAOWithMultisig(signer),
      deployNewDAOWithMultisig(signer),
    ]);

    return {signer, parentDAO, childDAO};
  }

  async function deployPlugin() {
    const {signer, parentDAO, childDAO} = await deployDaos();

    const parentChildPluginSetupFactory =
      new ParentChildPluginSetupTest__factory(signer);

    const parentChildPluginSetup = await parentChildPluginSetupFactory.deploy();

    const childAddress = await childDAO.dao.getAddress();

    const install = async () => {
      const response = await parentChildPluginSetup.prepareInstallation(
        childAddress,
        parentChildPluginSetupFactory.interface
          .getAbiCoder()
          .encode(["address[]"], [[]]),
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

    return {signer, parentDAO, childDAO, install, uninstall};
  }

  it("should deploy DAOs & assign root permission to itself", async function () {
    const {signer, parentDAO, childDAO} = await loadFixture(deployDaos);

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
    const {install} = await loadFixture(deployPlugin);

    const plugin = await install();

    const pluginAddress = await plugin.getAddress();

    assert.ok(ethers.isAddress(pluginAddress));
  });

  it("should be able to attach to parent dao", async function () {
    const {install, parentDAO, childDAO} = await loadFixture(deployPlugin);

    const plugin = await install();

    const [pluginAddress, parentAddress] = await Promise.all([
      plugin.getAddress(),
      parentDAO.dao.getAddress(),
    ]);

    // const response = await childDAO.dao.execute(
    //   ethers.ZeroHash,
    //   [
    //     {
    //       to: pluginAddress,
    //       value: 0,
    //       data: plugin.interface.encodeFunctionData("setParent", [
    //         parentAddress,
    //         true,
    //       ]),
    //     },
    //   ],
    //   0,
    // );

    // await ethers.provider.getTransactionReceipt(response.hash);

    // const currentParent = await plugin.parent();

    // assert.ok(parentAddress === currentParent);
  });
});
