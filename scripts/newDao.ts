import { uploadToIPFS } from "../utils/ipfs-upload";
import { Client } from "../utils/sdk";
import {
  DaoCreationSteps,
  DaoMetadata,
  MultisigClient,
} from "@aragon/sdk-client";
import {
  GasFeeEstimation,
  getNamedTypesFromMetadata,
  hexToBytes,
  SupportedNetwork,
} from "@aragon/sdk-client-common";
import { ethers } from "hardhat";

const client = Client(SupportedNetwork.MUMBAI);

// Once a DAO created, change this to create a new DAO
const DAO_ENS = "adenhall-subdao-test-18";

const PARENT_DAO = "0xc3e14b19ef066b0ae36b87fdeab9974b83eff24a";

const multisigSettings = {
  // This my wallet. Please change to your own
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
    "internalType": "address",
    "name": "parentDao",
    "type": "address",
    "description": "The address of the DAO to be the overruling parent",
  },
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
  // const metadataUri = await client.methods.pinMetadata(metadata);
  const metadataUri = `ipfs://${await uploadToIPFS(
    JSON.stringify(metadata),
    true, // for testing
  )}`;
  const hexBytes = ethers.utils.defaultAbiCoder.encode(
    getNamedTypesFromMetadata(INSTALLATION_ABI),
    [
      PARENT_DAO,
      multisigSettings.members,
      [
        multisigSettings.votingSettings.onlyListed,
        multisigSettings.votingSettings.minApprovals,
      ],
    ],
  );

  const pluginInstallItem = {
    // ID of the deployed plugin repo (After doing createPluginRepoWithFirstVersion)
    // From transaction: https://mumbai.polygonscan.com/tx/0x9796c68a43f3a1aa4b18766e6693cd6a5e1aba427d9f2c6059c3f6f2d2a6aeed
    id: "0xa266a624AbD43f5f2A804994EeCC2482F01435b5",
    data: hexToBytes(hexBytes),
  };

  const multisigPluginInstallItem = MultisigClient.encoding
    .getPluginInstallItem({
      members: multisigSettings.members,
      votingSettings: multisigSettings.votingSettings,
    }, "maticmum");

  // Estimate gas for the transaction.
  const estimatedGas: GasFeeEstimation = await client.estimation.createDao({
    metadataUri,
    plugins: [pluginInstallItem],
    ensSubdomain: DAO_ENS,
  });
  console.log({ avg: estimatedGas.average, max: estimatedGas.max });

  const steps = client.methods.createDao({
    metadataUri,
    plugins: [multisigPluginInstallItem, pluginInstallItem],
    ensSubdomain: DAO_ENS,
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
