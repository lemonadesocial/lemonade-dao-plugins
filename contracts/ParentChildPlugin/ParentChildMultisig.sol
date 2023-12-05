// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {Multisig} from "@aragon/osx/plugins/governance/multisig/Multisig.sol";

contract ParentChildMultisig is Multisig {
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal_ = proposals[proposalId];

        proposal_.executed = true;
    }
}
