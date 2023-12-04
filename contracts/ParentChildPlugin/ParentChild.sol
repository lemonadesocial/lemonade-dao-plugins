// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";
import {DAO} from "@aragon/osx/core/dao/DAO.sol";

contract ParentChild is PluginUUPSUpgradeable {
    function initialize(DAO _dao) external initializer {
        __PluginUUPSUpgradeable_init(_dao);
    }
}
