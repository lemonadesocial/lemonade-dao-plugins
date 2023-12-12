// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {Multisig} from "@aragon/osx/plugins/governance/multisig/Multisig.sol";

contract ParentChildMultisig is Multisig {
    /// @notice The ID of the permission required to deny proposals (adding them to blacklist)
    bytes32 public constant DENY_PROPOSAL_PERMISSION_ID =
        keccak256("DENY_PROPOSAL_PERMISSION");

    /// @notice stores a list of denied proposal IDs
    mapping(uint256 => bool) public deniedProposals;

    function denyProposal(uint256 proposalId) external auth(DENY_PROPOSAL_PERMISSION_ID) {
        deniedProposals[proposalId] = true;
    }
}
