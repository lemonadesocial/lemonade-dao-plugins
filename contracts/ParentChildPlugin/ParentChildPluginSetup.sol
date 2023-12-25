// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {DAO} from "@aragon/osx/core/dao/DAO.sol";
import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";
import {IPluginSetup} from "@aragon/osx/framework/plugin/setup/IPluginSetup.sol";
import {PluginSetup} from "@aragon/osx/framework/plugin/setup/PluginSetup.sol";
import {ParentChildPlugin} from "./ParentChildPlugin.sol";
import {ExecutionCondition} from "./ExecutionCondition.sol";

contract ParentChildPluginSetup is PluginSetup {
    /// @inheritdoc IPluginSetup
    function prepareInstallation(
        address _dao,
        bytes calldata _data
    )
        public
        virtual
        returns (address plugin, PreparedSetupData memory preparedSetupData)
    {
        address[] memory _plugins = abi.decode(_data, (address[]));

        DAO dao = DAO(payable(_dao));

        ParentChildPlugin parentChildPlugin = new ParentChildPlugin(
            dao,
            _plugins
        );

        plugin = address(parentChildPlugin);

        ExecutionCondition executionCondition = new ExecutionCondition(plugin);

        address _condition = address(executionCondition);

        uint256 _pluginsLength = _plugins.length;

        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](
                4 + _pluginsLength * 2
            );

        //-- grant root permission to plugin
        permissions[0] = (
            PermissionLib.MultiTargetPermission(
                PermissionLib.Operation.Grant,
                _dao,
                plugin,
                PermissionLib.NO_CONDITION,
                dao.ROOT_PERMISSION_ID()
            )
        );

        //-- revoke root permission from DAO
        permissions[1] = (
            PermissionLib.MultiTargetPermission(
                PermissionLib.Operation.Revoke,
                _dao,
                _dao,
                PermissionLib.NO_CONDITION,
                dao.ROOT_PERMISSION_ID()
            )
        );

        //-- grant setParent permission to DAO
        permissions[2] = (
            PermissionLib.MultiTargetPermission(
                PermissionLib.Operation.Grant,
                plugin,
                _dao,
                PermissionLib.NO_CONDITION,
                parentChildPlugin.SET_PARENT_PERMISSION_ID()
            )
        );

        //-- grant deactivate permission to DAO
        permissions[3] = (
            PermissionLib.MultiTargetPermission(
                PermissionLib.Operation.Grant,
                plugin,
                _dao,
                PermissionLib.NO_CONDITION,
                parentChildPlugin.DEACTIVATE_PERMISSION_ID()
            )
        );

        for (uint256 i; i < _pluginsLength; ) {
            address _otherPlugin = _plugins[i];

            permissions[4 + i * 2] = (
                PermissionLib.MultiTargetPermission(
                    PermissionLib.Operation.Revoke,
                    _dao,
                    _otherPlugin,
                    PermissionLib.NO_CONDITION,
                    dao.EXECUTE_PERMISSION_ID()
                )
            );

            permissions[5 + i * 2] = (
                PermissionLib.MultiTargetPermission(
                    PermissionLib.Operation.GrantWithCondition,
                    _dao,
                    _otherPlugin,
                    _condition,
                    dao.EXECUTE_PERMISSION_ID()
                )
            );

            unchecked {
                ++i;
            }
        }

        preparedSetupData.permissions = permissions;
    }

    /// @inheritdoc IPluginSetup
    function prepareUninstallation(
        address _dao,
        SetupPayload calldata _payload
    )
        public
        virtual
        returns (PermissionLib.MultiTargetPermission[] memory permissions)
    {
        DAO dao = DAO(payable(_dao));

        ParentChildPlugin parentChildPlugin = ParentChildPlugin(
            _payload.plugin
        );

        address[] memory _plugins = parentChildPlugin.getPlugins();

        uint256 _pluginsLength = _plugins.length;

        permissions = new PermissionLib.MultiTargetPermission[](
            2 + _pluginsLength * 2
        );

        for (uint256 i; i < _pluginsLength; ) {
            address _plugin = _plugins[i];

            permissions[i * 2] = PermissionLib.MultiTargetPermission(
                PermissionLib.Operation.Revoke,
                _dao,
                _plugin,
                PermissionLib.NO_CONDITION,
                dao.EXECUTE_PERMISSION_ID()
            );

            permissions[i * 2 + 1] = PermissionLib.MultiTargetPermission(
                PermissionLib.Operation.Grant,
                _dao,
                _plugin,
                PermissionLib.NO_CONDITION, //-- cannot obtain the previous condition here, so leave no condition
                dao.EXECUTE_PERMISSION_ID()
            );

            unchecked {
                ++i;
            }
        }

        //-- revoke deactivate permission from dao
        permissions[_pluginsLength * 2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _payload.plugin,
            _dao,
            PermissionLib.NO_CONDITION,
            parentChildPlugin.DEACTIVATE_PERMISSION_ID()
        );

        //-- revoke setParent permission from dao
        permissions[_pluginsLength * 2 + 1] = PermissionLib
            .MultiTargetPermission(
                PermissionLib.Operation.Revoke,
                _payload.plugin,
                _dao,
                PermissionLib.NO_CONDITION,
                parentChildPlugin.SET_PARENT_PERMISSION_ID()
            );
    }

    /// @inheritdoc IPluginSetup
    function implementation() external pure returns (address) {
        return address(0);
    }
}
