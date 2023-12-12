// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {PermissionCondition} from "@aragon/osx/core/permission/PermissionCondition.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {ParentChildMultisig} from "../ParentChildMultisig.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract AdminCondition is PermissionCondition, UUPSUpgradeable {
    ParentChildMultisig private parentChildMultisig;

    function initialize(address parentChildMultisigAddr) external {
        parentChildMultisig = ParentChildMultisig(parentChildMultisigAddr);
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
        (
            bytes32 _callId,
            IDAO.Action[] memory _actions,
            uint256 _allowFailureMap
        ) = abi.decode(_data[4:], (bytes32, IDAO.Action[], uint256));

        (_where, _who, _permissionId, _actions, _allowFailureMap);

        if (parentChildMultisig.deniedProposals(bytes32ToUint256(_callId))) {
            return false;
        }

        return true;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override {}
}
