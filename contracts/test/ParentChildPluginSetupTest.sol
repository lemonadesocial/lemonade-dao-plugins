// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";
import {ParentChildPluginSetup} from "../ParentChildPluginSetup.sol";

contract ParentChildPluginSetupTest is ParentChildPluginSetup {
    event InstallationPrepared(
        address plugin,
        PermissionLib.MultiTargetPermission[] permissions
    );

    event UninstallationPrepared(
        PermissionLib.MultiTargetPermission[] permissions
    );

    function prepareInstallation(
        address _dao,
        bytes calldata _data
    )
        public
        override
        returns (address plugin, PreparedSetupData memory preparedSetupData)
    {
        (plugin, preparedSetupData) = super.prepareInstallation(_dao, _data);

        emit InstallationPrepared(plugin, preparedSetupData.permissions);
    }

    function prepareUninstallation(
        address _dao,
        SetupPayload calldata _payload
    )
        public
        override
        returns (PermissionLib.MultiTargetPermission[] memory permissions)
    {
        permissions = super.prepareUninstallation(_dao, _payload);

        emit UninstallationPrepared(permissions);
    }
}
