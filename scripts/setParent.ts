import { ApproveProposalStep, ProposalCreationSteps } from "@aragon/sdk-client";
import { hexToBytes, SupportedNetwork } from "@aragon/sdk-client-common";
import { ParentChildPlugin__factory } from "../typechain-types";
import { Client, MultisigClient } from "../utils/sdk";

const client = Client(SupportedNetwork.MUMBAI);
const multisigClient = MultisigClient(SupportedNetwork.MUMBAI);
const daoAddressOrEns = "0xf5802b3BaF4C5Bbe41453E5FC6C67776ce50FA38";
const pluginAddress = "0x27Bc4997cDEee7666a9e828380Ed826f128F443e"; // Parent Child Plugin
const setParentABI = [
  {
    "internalType": "address",
    "name": "_newParent",
    "type": "address",
    "description": "The address of the new parent",
  },
  {
    "internalType": "bool",
    "name": "_hardlink",
    "type": "bool",
    "description": "Whether to hardlink the plugin or not",
  },
];
const parenChildPluginInterface = ParentChildPlugin__factory.createInterface();
const hexBytes = parenChildPluginInterface.encodeFunctionData("setParent", [
  "0xa25865885bf19f502c24a77fcadb547279b14fbf",
  false, // Hardlink
]);
const proposalMetadata = {
  title: "Set Parent Proposal",
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
  const governancePlugin = "0xe4056e8ec625A0aa890816F48Db69dEA5838759D"

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
