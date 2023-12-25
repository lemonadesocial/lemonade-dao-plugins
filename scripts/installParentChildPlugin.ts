import {
  DaoAction,
  PrepareInstallationParams,
  PrepareInstallationStep,
  SupportedNetwork,
} from "@aragon/sdk-client-common";
import { Client, MultisigClient } from "../utils/sdk";
import buildMetadata from "../contracts/ParentChildPlugin/build-metadata.json";
import { uploadToIPFS } from "../utils/ipfs-upload";
import { ApproveProposalStep, ProposalCreationSteps } from "@aragon/sdk-client";

// Instantiate the general purpose client from the Aragon OSx SDK context.
const client = Client(SupportedNetwork.MUMBAI);
const multisigClient = MultisigClient(SupportedNetwork.MUMBAI);
const daoAddressOrEns: string = "0xf5802b3baf4c5bbe41453e5fc6c67776ce50fa38"; // child DAO
const pluginAddress = "0xe4056e8ec625A0aa890816F48Db69dEA5838759D"; // Child DAO governance plugin

const installationAbi = buildMetadata.pluginSetup.prepareInstallation.inputs;

const prepareInstallationParams: PrepareInstallationParams = {
  daoAddressOrEns,
  pluginRepo: "0xa266a624AbD43f5f2A804994EeCC2482F01435b5", // Parent Child Plugin setup repo
  installationParams: [
    [pluginAddress], // Child DAO plugins
  ],
  installationAbi,
};

const proposalMetadata = {
  title: "Install Parent Child Proposal",
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
  // Prepare the installation
  const steps = client.methods.prepareInstallation(prepareInstallationParams);
  let actions: DaoAction[] = [];
  for await (const step of steps) {
    try {
      switch (step.key) {
        case PrepareInstallationStep.PREPARING:
          console.log({ txHash: step.txHash });
          break;
        case PrepareInstallationStep.DONE:
          console.log({ step });
          actions = client.encoding.applyInstallationAction(
            daoAddressOrEns,
            {
              pluginRepo: step.pluginRepo,
              pluginAddress: step.pluginAddress,
              versionTag: {
                build: step.versionTag.build,
                release: step.versionTag.release,
              },
              helpers: step.helpers,
              permissions: step.permissions.map((p) => ({
                who: p.who,
                where: p.where,
                operation: p.operation,
                permissionId: p.permissionId,
                condition: p.condition,
              })),
            },
          );
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Pins the metadata to IPFS and gets back an IPFS URI.
  const metadataUri: string = await uploadToIPFS(
    JSON.stringify(proposalMetadata),
    true,
  );

  // Remove the last action that revokes ROOT_PERMISSION on DAO from PluginSetupProcessor
  actions.pop()

  const proposalSteps = multisigClient.methods.createProposal(
    {
      actions,
      pluginAddress,
      metadataUri,
      startDate: new Date(Date.now() + 36000),
      endDate: new Date("1-2-2024"),
    },
  );

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

  // // Wait for 36000ms
  // await new Promise((resolve) => setTimeout(resolve, 36000));
  //
  // await approveAndExecuteProposal(proposalId);
})();
