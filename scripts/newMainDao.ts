import { Client } from "../utils/sdk";
import {
  CreateDaoParams,
  DaoCreationSteps,
  DaoMetadata,
  MultisigPluginInstallParams,
  MultisigClient
} from "@aragon/sdk-client";
import { GasFeeEstimation } from "@aragon/sdk-client-common";

// Instantiate the general purpose client from the Aragon OSx SDK context.
const NETWORK = "maticmum";
// @ts-ignore
const client = Client(NETWORK);

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

(async () => {
  const metadataUri = await client.methods.pinMetadata(metadata);

  const multisigPluginInstallParams: MultisigPluginInstallParams = {
    votingSettings: {
      minApprovals: 1,
      onlyListed: true
    },
    members: [
      '0x1522d4A58486DBbAf72dd464D57CC93e1Ec0d85c'
    ]
  };

  // Creates a TokenVoting plugin client with the parameteres defined above (with an existing token).
  const multisigInstallItem =
    MultisigClient.encoding.getPluginInstallItem(
      multisigPluginInstallParams,
      NETWORK
    );

  const createDaoParams: CreateDaoParams = {
    metadataUri,
    ensSubdomain: "adenhall", // my-org.dao.eth
    plugins: [multisigInstallItem], // plugin array cannot be empty or the transaction will fail. you need at least one governance mechanism to create your DAO.
  };

  // Estimate how much gas the transaction will cost.
  const estimatedGas: GasFeeEstimation = await client.estimation.createDao(
    createDaoParams
  );
  console.log({ avg: estimatedGas.average, maximum: estimatedGas.max });

  // Create the DAO.
  const steps = client.methods.createDao(createDaoParams);

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
