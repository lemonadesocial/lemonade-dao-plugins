// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {DAO} from "@aragon/osx/core/dao/DAO.sol";
import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";
import {PluginSetup, IPluginSetup} from "@aragon/osx/framework/plugin/setup/PluginSetup.sol";
import {Multisig} from "@aragon/osx/plugins/governance/multisig/Multisig.sol";
import {ParentChildMultisig} from "./ParentChildMultisig.sol";
import {AdminCondition} from "./permission-conditions/AdminCondition.sol";

contract ParentChildMultisigSetup is PluginSetup {
    ParentChildMultisig private parentChildPlugin;
    AdminCondition private adminConditionBase;

    constructor() {
        parentChildPlugin = new ParentChildMultisig();
        adminConditionBase = new AdminCondition();
    }

    /// @inheritdoc IPluginSetup
    function prepareInstallation(
        address _dao,
        bytes calldata _data
    )
        external
        returns (address plugin, PreparedSetupData memory preparedSetupData)
    {
        (
            address parentDao,
            address[] memory members,
            ParentChildMultisig.MultisigSettings
                memory parentChildMultisigSettings
        ) = abi.decode(_data, (address, address[], Multisig.MultisigSettings));

        plugin = createERC1967Proxy(
            address(parentChildPlugin),
            abi.encodeWithSelector(
                Multisig.initialize.selector,
                _dao,
                members,
                parentChildMultisigSettings
            )
        );
        address adminCondition = createERC1967Proxy(
            address(adminConditionBase),
            abi.encodeWithSelector(
                AdminCondition.initialize.selector,
                plugin
            )
        );

        // Prepare permissions
        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](6);

        // Set permissions to be granted.
        // Grant the list of permissions of the plugin to the DAO.
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            parentChildPlugin.UPDATE_MULTISIG_SETTINGS_PERMISSION_ID()
        );

        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            parentChildPlugin.UPGRADE_PLUGIN_PERMISSION_ID()
        );

        // Grant `DENY_PROPOSAL_PERMISSION` of the plugin to the parent DAO
        permissions[2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            plugin,
            parentDao,
            PermissionLib.NO_CONDITION,
            parentChildPlugin.DENY_PROPOSAL_PERMISSION_ID()
        );

        // Grant `EXECUTE_PERMISSION` of the DAO to the plugin.
        permissions[3] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _dao,
            plugin,
            adminCondition,
            DAO(payable(_dao)).EXECUTE_PERMISSION_ID()
        );

        // Grant `ROOT_PERMISSION` of the DAO to the parent DAO
        permissions[4] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _dao,
            parentDao,
            PermissionLib.NO_CONDITION,
            DAO(payable(_dao)).ROOT_PERMISSION_ID()
        );

        // Revoke `ROOT_PERMISSION` from the DAO
        permissions[5] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _dao,
            _dao,
            PermissionLib.NO_CONDITION,
            DAO(payable(_dao)).ROOT_PERMISSION_ID()
        );

        preparedSetupData.permissions = permissions;
    }

    /// @inheritdoc IPluginSetup
    function prepareUninstallation(
        address _dao,
        SetupPayload calldata _payload
    )
        external
        view
        returns (PermissionLib.MultiTargetPermission[] memory permissions)
    {
        (address parentDao) = abi.decode(_payload.data, (address));

        // Prepare permissions
        permissions = new PermissionLib.MultiTargetPermission[](6);

        // Set permissions to be Revoked.
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _payload.plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            parentChildPlugin.UPDATE_MULTISIG_SETTINGS_PERMISSION_ID()
        );

        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _payload.plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            parentChildPlugin.UPGRADE_PLUGIN_PERMISSION_ID()
        );

        permissions[2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _dao,
            _payload.plugin,
            PermissionLib.NO_CONDITION,
            DAO(payable(_dao)).EXECUTE_PERMISSION_ID()
        );

        permissions[3] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _payload.plugin,
            parentDao,
            PermissionLib.NO_CONDITION,
            parentChildPlugin.DENY_PROPOSAL_PERMISSION_ID()
        );

        permissions[4] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _dao,
            parentDao,
            PermissionLib.NO_CONDITION,
            DAO(payable(_dao)).ROOT_PERMISSION_ID()
        );

        permissions[5] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _dao,
            _dao,
            PermissionLib.NO_CONDITION,
            DAO(payable(_dao)).ROOT_PERMISSION_ID()
        );
    }

    /// @inheritdoc IPluginSetup
    function implementation() external view returns (address) {}
}
