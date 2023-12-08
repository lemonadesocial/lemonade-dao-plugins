// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {PermissionCondition} from "@aragon/osx/core/permission/PermissionCondition.sol";
import {DaoAuthorizableUpgradeable} from "@aragon/osx/core/plugin/dao-authorizable/DaoAuthorizableUpgradeable.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

contract AdminCondition is PermissionCondition, DaoAuthorizableUpgradeable {
    address internal parentDao;

    /// @notice The ID of the permission required to deny proposals (adding them to blacklist)
    bytes32 public constant DENY_PROPOSAL_PERMISSION_ID =
        keccak256("DENY_PROPOSAL_PERMISSION");

    /// @notice stores a list of denied proposal IDs
    mapping(uint256 => bool) internal proposalIds;

    constructor(address _parentDao) {
        parentDao = _parentDao;
    }

    function denyProposal(uint256 proposalId) external {
        proposalIds[proposalId] = true;
    }

    /// @notice converts bytes32 to uint256
    /// @dev see https://ethereum.stackexchange.com/questions/90629/converting-bytes32-to-uint256-in-solidity
    function asciiToInteger(bytes32 x) internal pure returns (uint256) {
        uint256 y;
        for (uint256 i = 0; i < 32; i++) {
            uint256 c = (uint256(x) >> (i * 8)) & 0xff;
            if (48 <= c && c <= 57) y += (c - 48) * 10 ** i;
            else break;
        }
        return y;
    }

    function isGranted(
        address _where,
        address _who,
        bytes32 _permissionId,
        bytes calldata _data
    ) external view returns (bool) {
        bytes32 _callId = abi.decode(_data, (bytes32));

        (_where, _who, _permissionId);

        if (proposalIds[asciiToInteger(_callId)]) {
          return false;
        }

        return true;
    }
}
