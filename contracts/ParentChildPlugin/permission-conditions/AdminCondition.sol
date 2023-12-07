// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {PermissionCondition} from "@aragon/osx/core/permission/PermissionCondition.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {DaoAuthorizableUpgradeable} from "@aragon/osx/core/plugin/dao-authorizable/DaoAuthorizableUpgradeable.sol";

contract AdminCondition is PermissionCondition, DaoAuthorizableUpgradeable {
    address internal parentDao;

    /// @notice The ID of the permission required to deny proposals (adding them to blacklist)
    bytes32 public constant DENY_PROPOSAL_PERMISSION_ID = keccak256("DENY_PROPOSAL_PERMISSION");

    /// @notice stores a list of denied proposal IDs
    mapping(bytes32 => bool) internal proposalIds;

    constructor(address _parentDao) {
        parentDao = _parentDao;
    }

    function denyProposal(uint256 proposalId) external {
      proposalIds[bytes32(proposalId)] = true;
    }

    function isGranted(
        address _where,
        address _who,
        bytes32 _permissionId,
        bytes calldata _data
    ) external view returns (bool) {

        (bytes32 _proposalId, IDAO.Action[] memory _actions, uint256 _allowFailureMap) = abi.decode(_data, (bytes32, IDAO.Action[], uint256));

        (_where, _who, _permissionId);

        return !proposalIds[_proposalId];
    }
}
