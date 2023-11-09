import { Client } from "../utils/sdk";
import {
  PrepareInstallationParams,
  PrepareInstallationStep,
  getNamedTypesFromMetadata,
} from "@aragon/sdk-client-common";

// Instantiate the general purpose client from the Aragon OSx SDK context.
const client = Client("maticmum");

const multisigSettings = {
  members: ["0x1522d4A58486DBbAf72dd464D57CC93e1Ec0d85c"],
  votingSettings: {
    minApprovals: 1,
    onlyListed: true,
  },
};

const INSTALLATION_ABI = [
  {
    internalType: "address[]",
    name: "members",
    type: "address[]",
    description: "The addresses of the initial members to be added.",
  },
  {
    components: [
      {
        internalType: "bool",
        name: "onlyListed",
        type: "bool",
        description:
          "Whether only listed addresses can create a proposal or not.",
      },
      {
        internalType: "uint16",
        name: "minApprovals",
        type: "uint16",
        description:
          "The minimal number of approvals required for a proposal to pass.",
      },
    ],
    internalType: "struct Multisig.MultisigSettings",
    name: "multisigSettings",
    type: "tuple",
    description: "The inital multisig settings.",
  },
];

const prepareInstallationParams: PrepareInstallationParams = {
  daoAddressOrEns: "0x7b2538DD1fedfd3F24a0B90B3c0680d1F9133a16", // adenhall2.dao.eth
  pluginRepo: "0x7b2538DD1fedfd3F24a0B90B3c0680d1F9133a16", // GroupMultisigPlugin
  installationParams: [
    multisigSettings.members,
    [
      multisigSettings.votingSettings.onlyListed,
      multisigSettings.votingSettings.minApprovals,
    ],
  ],
  installationAbi: INSTALLATION_ABI,
};

(async () => {
  // Prepare the installation
  const steps = client.methods.prepareInstallation(prepareInstallationParams);
  for await (const step of steps) {
    try {
      switch (step.key) {
        case PrepareInstallationStep.PREPARING:
          console.log({ txHash: step.txHash });
          break;
        case PrepareInstallationStep.DONE:
          console.log({ step });
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
})();
