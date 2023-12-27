import { ApproveProposalStep, ProposalCreationSteps } from "@aragon/sdk-client";
import { hexToBytes, SupportedNetwork } from "@aragon/sdk-client-common";
import { ParentChildPlugin__factory } from "../typechain-types";
import { MultisigClient } from "../utils/sdk";

const multisigClient = MultisigClient(SupportedNetwork.MUMBAI);
const pluginAddress = "0x8f785938f7B612B6353dec648Fbb3651743B9059"; // Parent Child Plugin
const parenChildPluginInterface = ParentChildPlugin__factory.createInterface();
const hexBytes = parenChildPluginInterface.encodeFunctionData("unsetParent");
const proposalMetadata = {
  title: "Unset Parent Proposal",
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
const createProposal = async () => {
  const metadataUri = await multisigClient.methods.pinMetadata(
    proposalMetadata,
  );
  // const dao = await client.methods.getDao(daoAddressOrEns);
  const governancePlugin = "0x7eB9AF9cBe2aC13cE5C5c33552ECD4Fbb5Dc4c47" // Governance plugin

  const steps = multisigClient.methods.createProposal({
    metadataUri,
    pluginAddress: governancePlugin || "",
    actions: [{
      data: hexToBytes(hexBytes),
      to: pluginAddress,
      value: BigInt(0),
    }],
    startDate: new Date(Date.now() + 36000),
    endDate: new Date("1-2-2024"),
  });

  for await (const step of steps) {
    switch (step.key) {
      case ProposalCreationSteps.CREATING:
        console.log({ txHash: step.txHash });
        break;
      case ProposalCreationSteps.DONE:
        console.log("Proposal ID: ", step.proposalId);
        return step.proposalId;
    }
  }
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
  const proposalId = await createProposal();
  // await approveAndExecuteProposal(proposalId);
})();
