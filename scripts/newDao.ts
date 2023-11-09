import { Client } from "../utils/sdk";
import { DaoCreationSteps, DaoMetadata, MultisigPluginSettings } from "@aragon/sdk-client";
import {
  getNamedTypesFromMetadata,
  LIVE_CONTRACTS,
  hexToBytes,
  SupportedVersion,
} from "@aragon/sdk-client-common";
import { ethers } from "hardhat";

const client = Client("maticmum");

const multisigSettings: MultisigPluginSettings = {
  members: ["0x1522d4A58486DBbAf72dd464D57CC93e1Ec0d85c"],
  votingSettings: {
    minApprovals: 1,
    onlyListed: true,
  },
};

const metadata: DaoMetadata = {
  name: "Lemonade",
  description: "Lemonade Communities",
  links: [
    {
      name: "Lemonade",
      url: "https://about.lemonade.social",
    },
  ],
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

(async () => {
  const metadataUri = await client.methods.pinMetadata(metadata);
  const hexBytes = ethers.utils.defaultAbiCoder.encode(
    getNamedTypesFromMetadata(INSTALLATION_ABI),
    Object.values(multisigSettings)
  );

  const pluginInstallItem = {
    id: LIVE_CONTRACTS[SupportedVersion.LATEST].maticmum.multisigRepoAddress,
    data: hexToBytes(hexBytes),
  };

  const steps = client.methods.createDao({
    metadataUri,
    plugins: [pluginInstallItem],
    ensSubdomain: "adenhall2",
  });

  for await (const step of steps) {
    try {
      switch (step.key) {
        case DaoCreationSteps.CREATING:
          console.log({ txHash: step.txHash });
          break;
        case DaoCreationSteps.DONE:
          console.log({
            daoAddress: step.address,
            pluginAddresses: step.pluginAddresses,
          });
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
})();
