// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {NonBlockingLzApp} from "../LzApp/NonBlockingLzApp.sol";

abstract contract LayerOne is NonBlockingLzApp {
    /// @notice A container for the majority voting bridge settings that will be required when bridging and receiving the proposals from other chains
    /// @param chainID A parameter to select the id of the destination chain
    /// @param bridge A parameter to select the address of the bridge you want to interact with
    /// @param childDAO A parameter to select the address of the DAO you want to interact with in the destination chain
    /// @param childPlugin A parameter to select the address of the plugin you want to interact with in the destination chain
    struct BridgeSettings {
        uint16 chainId;
        address bridge;
        address childDAO;
        address childPlugin;
    }

    /// @notice The ID of the permission required to call the `updateBridgeSettings` function.
    bytes32 public constant UPDATE_BRIDGE_SETTINGS_PERMISSION_ID =
        keccak256("UPDATE_BRIDGE_SETTINGS_PERMISSION");

    /// @notice The struct storing the bridge settings.
    BridgeSettings public bridgeSettings;
}
