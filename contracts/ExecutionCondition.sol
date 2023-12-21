// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {PermissionCondition} from "@aragon/osx/core/permission/PermissionCondition.sol";
import {ParentChildPlugin} from "./ParentChildPlugin.sol";

contract ExecutionCondition is PermissionCondition {
    ParentChildPlugin internal plugin;

    constructor(address _plugin) {
        plugin = ParentChildPlugin(_plugin);
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

        return !plugin.rejections(_callId);
    }
}
