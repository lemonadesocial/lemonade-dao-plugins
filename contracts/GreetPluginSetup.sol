// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import {PluginSetup} from "@aragon/osx/framework/plugin/setup/PluginSetup.sol";
import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {GreetPlugin} from "./GreetPlugin.sol";

contract GreetPluginSetup is PluginSetup {
    function prepareInstallation(
        address _dao,
        bytes memory
    )
        external
        returns (address plugin, PreparedSetupData memory preparedSetupData)
    {
        plugin = address(new GreetPlugin(IDAO(_dao)));

        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](1);

        permissions[0] = PermissionLib.MultiTargetPermission({
            operation: PermissionLib.Operation.Grant,
            where: plugin,
            who: _dao,
            condition: PermissionLib.NO_CONDITION,
            permissionId: keccak256("GREET_PERMISSION")
        });

        preparedSetupData.permissions = permissions;
    }

    function prepareUninstallation(
        address _dao,
        SetupPayload calldata _payload
    )
        external
        pure
        returns (PermissionLib.MultiTargetPermission[] memory permissions)
    {
        permissions = new PermissionLib.MultiTargetPermission[](1);

        permissions[0] = PermissionLib.MultiTargetPermission({
            operation: PermissionLib.Operation.Revoke,
            where: _payload.plugin,
            who: _dao,
            condition: PermissionLib.NO_CONDITION,
            permissionId: keccak256("GREET_PERMISSION")
        });
    }

    function implementation() external view returns (address) {}
}
