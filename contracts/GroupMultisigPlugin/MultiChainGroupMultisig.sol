// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {GroupMultisigBase} from "./GroupMultisigBase.sol";
import {NonBlockingLzApp} from "../LzApp/NonBlockingLzApp.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";

contract MultiChainGroupMultisig is GroupMultisigBase, NonBlockingLzApp {

    /// @notice A container for the multisig bridge settings that will be required when bridging and receiving the proposals from other chains
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

    /// @notice Updates the bridge settings.
    /// @param _bridgeSettings The new voting settings.
    function updateBridgeSettings(
        BridgeSettings calldata _bridgeSettings
    ) external virtual auth(UPDATE_BRIDGE_SETTINGS_PERMISSION_ID) {
        bridgeSettings = _bridgeSettings;
        _setEndpoint(_bridgeSettings.bridge);
        bytes memory remoteAndLocalAddresses = abi.encodePacked(
            _bridgeSettings.childPlugin,
            address(this)
        );
        _setTrustedRemoteAddress(
            _bridgeSettings.chainId,
            remoteAndLocalAddresses
        );
    }

    function createMultiChainProposal(
        bytes calldata _metadata,
        IDAO.Action[] calldata _actions,
        uint256 _allowFailureMap,
        bool _approveProposal,
        bool _tryExecution,
        uint64 _startDate,
        uint64 _endDate
    ) external returns (uint256 proposalId) {
        proposalId = this.createProposal(
            _metadata,
            _actions,
            _allowFailureMap,
            _approveProposal,
            _tryExecution,
            _startDate,
            _endDate
        );

        // Bridge the proposal over to the L2
        bytes memory encodedMessage = abi.encode(
            proposalId,
            _startDate,
            _endDate,
            _tryExecution
        );

        if (
            bridgeSettings.bridge != address(0) ||
            bridgeSettings.chainId != uint16(0) ||
            address(bridgeSettings.childDAO) != address(0)
        ) {
            _lzSend({
                _dstChainId: bridgeSettings.chainId,
                _payload: encodedMessage,
                _refundAddress: payable(_msgSender()),
                _zroPaymentAddress: address(0),
                _adapterParams: bytes(""),
                _nativeFee: address(this).balance
            });
        }
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual override {
        (uint256 proposalId, address approver) = abi.decode(
            _payload,
            (uint256, address)
        );

        Proposal storage proposal_ = proposals[proposalId];
        proposal_.approvals += 1;

        emit Approved({proposalId: proposalId, approver: approver});
    }
}
