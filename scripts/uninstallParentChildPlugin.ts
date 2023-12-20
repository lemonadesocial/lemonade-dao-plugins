import { ApproveProposalStep, ProposalCreationSteps } from "@aragon/sdk-client";
import {
  DaoAction,
  PrepareUninstallationParams,
  PrepareUninstallationSteps,
  SupportedNetwork,
} from "@aragon/sdk-client-common";
import { Client, MultisigClient } from "../utils/sdk";
import { uploadToIPFS } from "../utils/ipfs-upload";

const client = Client(SupportedNetwork.MUMBAI);
const multisigClient = MultisigClient(SupportedNetwork.MUMBAI);

const daoAddressOrEns = "0xf36313600dc923c5c39c3a1b53f184a2618495c8";
const pluginAddress = "0xb8482bfa3e79e23d4363fc314ee4aa1a48ddecb5";

const prepareUninstallationParams: PrepareUninstallationParams = {
  daoAddressOrEns,
  pluginAddress,
  uninstallationParams: [
    "0x3285ef3ab8069a85ce73a3f3576deddd95a901e3", // parent DAO
  ],
  uninstallationAbi: ["address"],
};

const proposalMetadata = {
  title: "Test Deny Proposal",
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
  // Because this operation creates a transaction, we need to make sure the preparation is consumed afterwards.
  // Otherwise running this again would fail.
  const prepareSteps = client.methods.prepareUninstallation(
    prepareUninstallationParams,
  );
  let uninstallationAction: DaoAction[] = [];
  for await (const step of prepareSteps) {
    try {
      switch (step.key) {
        case PrepareUninstallationSteps.PREPARING:
          console.log({ txHash: step.txHash });
          break;
        case PrepareUninstallationSteps.DONE:
          console.log({
            permissions: step.permissions,
            pluginAddress: step.pluginAddress,
            pluginRepo: step.pluginRepo,
            versionTag: step.versionTag,
          });
          uninstallationAction = client.encoding.applyUninstallationAction(
            daoAddressOrEns,
            step,
          );
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
  return uninstallationAction;
}

const approveAndExecuteProposal = async (proposalId: string) => {
  const approveSteps = multisigClient.methods.approveProposal({
    proposalId,
    tryExecution: true
  })

  for await (const step of approveSteps) {
    try {
      switch (step.key) {
        case ApproveProposalStep.APPROVING:
          console.log({ txHash: step.txHash });
          break;
        case ApproveProposalStep.DONE:
          console.log('Donz')
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
}

(async () => {
  const actions = await prepareUninstallationAction()

  // Pins the metadata to IPFS and gets back an IPFS URI.
  const metadataUri: string = await uploadToIPFS(JSON.stringify(proposalMetadata), true);

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
  await new Promise(resolve => setTimeout(resolve, 36000));

  await approveAndExecuteProposal(proposalId)
})();
