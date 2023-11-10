// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {SafeCastUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {Multisig} from "@aragon/osx/plugins/governance/multisig/Multisig.sol";
import {GroupMultisigList} from "./GroupMultisigList.sol";
import {Vault} from "./Vault.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GroupMultisig is Multisig {
    using SafeCastUpgradeable for uint256;
    using Counters for Counters.Counter;

    /// @notice The ID of the permission required to call the `addAddresses` and `removeAddresses` functions.
    bytes32 public constant UPDATE_ADDRESSES_PERMISSION_ID =
        keccak256("UPDATE_ADDRESSES_PERMISSION");

    bytes32 public constant CREATE_GROUP_PERMISSION_ID =
        keccak256("CREATE_GROUP_PERMISSION");

    Counters.Counter public _groupIdCounter;
    mapping(uint256 => string) public groupsNames;
    mapping(uint256 => GroupMultisigList) public groups;
    mapping(uint256 => Vault) public groupVault;

    function createGroup(
        string calldata _groupName,
        address[] calldata _members,
        address _tokenAllocation,
        uint256 _initialAllocation
    ) external auth(CREATE_GROUP_PERMISSION_ID) {
        // Assign group ID
        uint256 groupId = _groupIdCounter.current();
        _groupIdCounter.increment();

        // Create its own members list
        GroupMultisigList group = new GroupMultisigList();
        group.addAddresses(_members);

        groupsNames[groupId] = _groupName;
        groups[groupId] = group;

        // Create its own vault
        Vault vault = new Vault();
        groupVault[groupId] = vault;

        // Transfer tokens to the vault
        ERC20(_tokenAllocation).transfer(address(vault), _initialAllocation);

        // Members shout out
        emit MembersAdded({members: _members});
    }

    /// @notice Adds new members to the address list.
    /// @param _members The addresses of members to be added.
    /// @dev This function is used during the plugin initialization.
    function addAddressesToGroup(
        address[] calldata _members,
        uint256 _groupId
    ) external auth(UPDATE_ADDRESSES_PERMISSION_ID) {
        groups[_groupId].addAddresses(_members);

        emit MembersAdded({members: _members});
    }

    /// @notice Removes existing members from the address list.
    /// @param _members The addresses of the members to be removed.
    function removeAddressesToGroup(
        address[] calldata _members,
        uint256 _groupId
    ) external auth(UPDATE_ADDRESSES_PERMISSION_ID) {
        groups[_groupId].removeAddresses(_members);

        emit MembersRemoved({members: _members});
    }

    function isMember(
        address _account,
        uint256 _groupId
    ) public view returns (bool) {
        return groups[_groupId].isListed(_account);
    }

    function withdrawNFT(
        address _tokenAddress,
        uint256 _tokenId,
        address _destination,
        uint256 _groupId
    ) external {
        require(isMember(_msgSender(), _groupId), "Not a group member");
        groupVault[_groupId].withdrawNFT(_tokenAddress, _tokenId, _destination);
    }

    function withdrawERC20(
        address _tokenAddress,
        uint256 _amount,
        address _destination,
        uint256 _groupId
    ) external {
        require(isMember(_msgSender(), _groupId), "Not a group member");
        groupVault[_groupId].withdrawERC20(
            _tokenAddress,
            _amount,
            _destination
        );
    }

    function getGroupVault(uint256 _groupId) external view returns (address) {
        return address(groupVault[_groupId]);
    }
}
