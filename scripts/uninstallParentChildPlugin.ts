import { ApproveProposalStep, ProposalCreationSteps } from "@aragon/sdk-client";
import {
  findLog,
  MultiTargetPermission,
  SupportedNetwork,
} from "@aragon/sdk-client-common";
import { Client, MultisigClient } from "../utils/sdk";
import { uploadToIPFS } from "../utils/ipfs-upload";
import {
  activeContractsList,
  PluginSetupProcessor__factory,
} from "@aragon/osx-ethers";

const client = Client(SupportedNetwork.MUMBAI);
const multisigClient = MultisigClient(SupportedNetwork.MUMBAI);

const daoAddressOrEns = "0xf5802b3baf4c5bbe41453e5fc6c67776ce50fa38"; // Child DAO
const pluginAddress = "0x27Bc4997cDEee7666a9e828380Ed826f128F443e"; // Parent Child Plugin

const pluginSetupRepo = "0xa266a624AbD43f5f2A804994EeCC2482F01435b5";

const proposalMetadata = {
  title: "Uninstall Parent Child Proposal",
  summary: "This is a short description",
  description: "This is a long description",
  resources: [
    {
      name: "Discord",
      url: "https://discord.com/...",
    },
    {
      name: "Website",
      url: "https://website...",
    },
  ],
  media: {
    logo: "https://...",
    header: "https://...",
  },
};

const prepareUninstallationAction = async () => {
  const pspContract = PluginSetupProcessor__factory.connect(
    activeContractsList.mumbai.PluginSetupProcessor,
    client.web3.getConnectedSigner(),
  );

  const tx = await pspContract.prepareUninstallation(
    daoAddressOrEns,
    {
      pluginSetupRef: {
        pluginSetupRepo,
        versionTag: {
          build: 1,
          release: 1,
        },
      },
      setupPayload: {
        plugin: pluginAddress,
        currentHelpers: [],
        data: "0x",
      },
    },
  );
  const cr = await tx.wait();

  const log = findLog(cr, pspContract.interface, "UninstallationPrepared");
  if (!log) {
    throw new Error("Log not found");
  }
  const parsedLog = pspContract.interface.parseLog(log);
  const permissions = parsedLog.args["permissions"] as MultiTargetPermission[];
  if (!permissions) {
    throw new Error("Permissions not found");
  }
  return client.encoding.applyUninstallationAction(
    daoAddressOrEns,
    {
      permissions: permissions.map((permission: MultiTargetPermission) => ({
        operation: permission.operation,
        where: permission.where,
        who: permission.who,
        permissionId: permission.permissionId,
      })),
      pluginRepo: pluginSetupRepo,
      pluginAddress,
      versionTag: {
        build: 1,
        release: 1,
      },
    },
  );
};

const approveAndExecuteProposal = async (proposalId: string) => {
  const approveSteps = multisigClient.methods.approveProposal({
    proposalId,
    tryExecution: true,
  });

  for await (const step of approveSteps) {
    try {
      switch (step.key) {
        case ApproveProposalStep.APPROVING:
          console.log({ txHash: step.txHash });
          break;
        case ApproveProposalStep.DONE:
          console.log("Donz");
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
};

(async () => {
  const actions = await prepareUninstallationAction();
  console.log(actions)

  // Pins the metadata to IPFS and gets back an IPFS URI.
  const metadataUri: string = await uploadToIPFS(
    JSON.stringify(proposalMetadata),
    true,
  );

  const proposalSteps = multisigClient.methods.createProposal({
    actions,
    pluginAddress,
    metadataUri,
    startDate: new Date(Date.now() + 36000),
    endDate: new Date("1-2-2024"),
  });

  let proposalId = "";
  for await (const step of proposalSteps) {
    try {
      switch (step.key) {
        case ProposalCreationSteps.CREATING:
          console.log({ txHash: step.txHash });
          break;
        case ProposalCreationSteps.DONE:
          console.log({ proposalId: step.proposalId });
          proposalId = step.proposalId;
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Wait for 36000ms
  await new Promise((resolve) => setTimeout(resolve, 36000));

  await approveAndExecuteProposal(proposalId);
})();
