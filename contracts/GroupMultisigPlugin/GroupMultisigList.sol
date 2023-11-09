// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {Addresslist} from "@aragon/osx/plugins/utils/Addresslist.sol";

/// @title GroupMultisigList
/// @notice Creates an addresslist for each group
/// @dev This contract inherits from `Addresslist`
contract GroupMultisigList is Addresslist {
    function addAddresses(address[] calldata _newAddresses) public {
        _addAddresses(_newAddresses);
    }

    function removeAddresses(address[] calldata _exitingAddresses) public {
        _removeAddresses(_exitingAddresses);
    }
}
