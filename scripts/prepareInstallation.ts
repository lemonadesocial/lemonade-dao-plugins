import { MultisigClient } from "../utils/sdk";
import {
  PrepareInstallationStep,
} from "@aragon/sdk-client-common";
import { MultisigPluginPrepareInstallationParams, MultisigPluginSettings } from '@aragon/sdk-client';

const client = MultisigClient("maticmum");

const multisigSettings: MultisigPluginSettings = {
  members: [
    '0x1522d4A58486DBbAf72dd464D57CC93e1Ec0d85c'
  ],
  votingSettings: {
    minApprovals: 1,
    onlyListed: true
  }
}

const prepareInstallationParams: MultisigPluginPrepareInstallationParams = {
  daoAddressOrEns: "0xc3e14b19ef066b0ae36b87fdeab9974b83eff24a", // my-dao.dao.eth
  settings: multisigSettings,
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
