// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {PermissionCondition} from "@aragon/osx/core/permission/PermissionCondition.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {DAO} from "@aragon/osx/core/dao/DAO.sol";
import {PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";

contract AdminCondition is PermissionCondition, PluginUUPSUpgradeable {
    /// @notice The ID of the permission required to deny proposals (adding them to blacklist)
    bytes32 public constant DENY_PROPOSAL_PERMISSION_ID =
        keccak256("DENY_PROPOSAL_PERMISSION");

    /// @notice stores a list of denied proposal IDs
    mapping(uint256 => bool) internal proposalIds;

    /// @param _dao The IDAO interface of the associated DAO.
    function initialize(
        IDAO _dao
    ) external initializer {
        __PluginUUPSUpgradeable_init(_dao);
    }

    function denyProposal(uint256 proposalId) external auth(DENY_PROPOSAL_PERMISSION_ID) {
        proposalIds[proposalId] = true;
    }

    /// @notice Checks if this or the parent contract supports an interface by its ID.
    /// @param _interfaceId The ID of the interface.
    /// @return Returns `true` if the interface is supported.
    function supportsInterface(
        bytes4 _interfaceId
    ) public view virtual override(PluginUUPSUpgradeable, PermissionCondition) returns (bool) {
        return
            PermissionCondition.supportsInterface(_interfaceId) ||
            PluginUUPSUpgradeable.supportsInterface(_interfaceId) ||
            super.supportsInterface(_interfaceId);
    }

    /// @notice converts bytes32 to uint256
    /// @dev see https://ethereum.stackexchange.com/questions/90629/converting-bytes32-to-uint256-in-solidity
    function bytes32ToUint256(bytes32 x) internal pure returns (uint256) {
        return uint256(x) & 0xfff;
    }

    function isGranted(
        address _where,
        address _who,
        bytes32 _permissionId,
        bytes calldata _data
    ) external view returns (bool) {
        /// @dev skipping first 4 bytes of _data (Function ID) as we only care about the parameters in `dao.execute()`
        (bytes32 _callId, IDAO.Action[] memory _actions, uint256 _allowFailureMap) = abi.decode(_data[4:], (bytes32, IDAO.Action[], uint256));

        (_where, _who, _permissionId, _actions, _allowFailureMap);

        if (proposalIds[bytes32ToUint256(_callId)]) {
          return false;
        }

        return true;
    }
}
