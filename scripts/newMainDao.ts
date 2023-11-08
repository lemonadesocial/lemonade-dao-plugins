import { Client } from "../utils/sdk";
import {
  CreateDaoParams,
  DaoCreationSteps,
  DaoMetadata,
  TokenVotingClient,
  TokenVotingPluginInstall,
  VotingMode,
} from "@aragon/sdk-client";
import { GasFeeEstimation } from "@aragon/sdk-client-common";

// Instantiate the general purpose client from the Aragon OSx SDK context.
const NETWORK = "goerli";
const client = Client(NETWORK);

const metadata: DaoMetadata = {
  name: "Lemonade",
  description: "Lemonade Communities",
  avatar: "image-url",
  links: [
    {
      name: "Lemonade",
      url: "https://about.lemonade.social",
    },
  ],
};

(async () => {
  const metadataUri = await client.methods.pinMetadata(metadata);

  const tokenVotingPluginInstallParams: TokenVotingPluginInstall = {
    votingSettings: {
      minDuration: 60 * 60 * 24 * 2, // seconds
      minParticipation: 0.25, // 25%
      supportThreshold: 0.5, // 50%
      minProposerVotingPower: BigInt("5000"), // default 0
      votingMode: VotingMode.EARLY_EXECUTION, // default is STANDARD. other options: EARLY_EXECUTION, VOTE_REPLACEMENT
    },
    newToken: {
      name: "Lemon", // the name of your token
      symbol: "LEMON", // the symbol for your token. shouldn't be more than 5 letters
      decimals: 18, // the number of decimals your token uses
      //   minter: "0x...", // optional. if you don't define any, we'll use the standard OZ ERC20 contract. Otherwise, you can define your own token minter contract address.
      balances: [
        {
          // Defines the initial balances of the new token
          address: "0x1522d4A58486DBbAf72dd464D57CC93e1Ec0d85c", // address of the account to receive the newly minted tokens
          balance: BigInt(10), // amount of tokens that address should receive
        },
      ],
    },
  };

  // Creates a TokenVoting plugin client with the parameteres defined above (with an existing token).
  const tokenVotingInstallItem =
    TokenVotingClient.encoding.getPluginInstallItem(
      tokenVotingPluginInstallParams,
      NETWORK
    );

  const createDaoParams: CreateDaoParams = {
    metadataUri,
    ensSubdomain: "lemonadesocial", // my-org.dao.eth
    plugins: [tokenVotingInstallItem], // plugin array cannot be empty or the transaction will fail. you need at least one governance mechanism to create your DAO.
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
