// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import {IDAO} from "@aragon/osx/core/dao/IDAO.sol";
import {DAO} from "@aragon/osx/core/dao/DAO.sol";
import {Plugin} from "@aragon/osx/core/plugin/Plugin.sol";
import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";
import {PermissionManager} from "@aragon/osx/core/permission/PermissionManager.sol";

contract ParentChildPlugin is Plugin {
    address public parent;
    bool public hardLink;
    bool public deactivated;
    mapping(bytes32 => bool) public rejections;
    address[] internal plugins;

    bytes32 public constant DEACTIVATE_PERMISSION_ID =
        keccak256("DEACTIVATE_PERMISSION");
    bytes32 public constant SET_PARENT_PERMISSION_ID =
        keccak256("SET_PARENT_PERMISSION");
    bytes32 public constant INTERVENE_PROPOSAL_PERMISSION_ID =
        keccak256("INTERVENE_PROPOSAL_PERMISSION");

    error ParentAlreadyAttached(address parent);
    error CannotUnsetParent();
    error PluginDeactivated();
    error ParentNotDetached(address parent);

    event ProposalIntervened(bytes32 proposalId, bool rejected);
    event ParentSet(address parent, address child, bool hardLink);
    event ParentUnset(address parent, address child);
    event Deactivated();

    constructor(IDAO _dao, address[] memory _plugins) Plugin(_dao) {
        uint256 _pluginsLength = _plugins.length;

        for (uint256 i; i < _pluginsLength; ) {
            plugins.push(_plugins[i]);

            unchecked {
                ++i;
            }
        }
    }

    function getPlugins() public view returns (address[] memory _plugins) {
        uint256 pluginsLength = plugins.length;

        _plugins = new address[](pluginsLength);

        for (uint256 i; i < pluginsLength; ) {
            _plugins[i] = plugins[i];

            unchecked {
                ++i;
            }
        }
    }

    function deactivate() public isActivated auth(DEACTIVATE_PERMISSION_ID) {
        if (parent != address(0)) {
            revert ParentNotDetached(parent);
        }

        deactivated = true;

        address _this = address(this);
        address _dao = address(dao());
        DAO dao = DAO(payable(_dao));

        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](2);

        //-- grant root permission back to child dao
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _dao,
            _dao,
            PermissionLib.NO_CONDITION,
            dao.ROOT_PERMISSION_ID()
        );

        //-- revoke root permission from plugin
        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _dao,
            _this,
            PermissionLib.NO_CONDITION,
            dao.ROOT_PERMISSION_ID()
        );

        dao.applyMultiTargetPermissions(permissions);

        emit Deactivated();
    }

    function intervene(
        bytes32 _proposalId,
        bool _rejected
    ) public isActivated auth(INTERVENE_PROPOSAL_PERMISSION_ID) {
        rejections[_proposalId] = _rejected;

        emit ProposalIntervened(_proposalId, _rejected);
    }

    function setParent(
        address _newParent,
        bool _hardLink
    ) public isActivated auth(SET_PARENT_PERMISSION_ID) {
        if (parent != address(0)) {
            revert ParentAlreadyAttached(parent);
        }

        if (_newParent == address(0)) {
            if (hardLink && _msgSender() != parent) {
                revert CannotUnsetParent();
            }

            _unsetParent();
        } else {
            _setParent(_newParent, _hardLink);
        }
    }

    function _unsetParent() internal {
        address _parent = parent;
        parent = address(0);

        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](3);

        address _this = address(this);
        address _dao = address(dao());

        //-- revoke child dao to call setParent on plugin
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _this,
            _dao,
            PermissionLib.NO_CONDITION,
            SET_PARENT_PERMISSION_ID
        );

        //-- revoke parentDao to call interveneProposal on plugin
        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _this,
            _parent,
            PermissionLib.NO_CONDITION,
            INTERVENE_PROPOSAL_PERMISSION_ID
        );

        //-- revoke parentDao to call setParent on plugin
        permissions[2] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Revoke,
            _this,
            _parent,
            PermissionLib.NO_CONDITION,
            SET_PARENT_PERMISSION_ID
        );

        DAO(payable(_dao)).applyMultiTargetPermissions(permissions);

        emit ParentUnset(_parent, _dao);
    }

    function _setParent(address _newParent, bool _hardLink) internal {
        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](3);

        address _this = address(this);
        address _dao = address(dao());

        //-- grant parentDao to call setParent on plugin
        permissions[0] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _this,
            _newParent,
            PermissionLib.NO_CONDITION,
            SET_PARENT_PERMISSION_ID
        );

        //-- grant parentDao to call rejectProposal on plugin
        permissions[1] = PermissionLib.MultiTargetPermission(
            PermissionLib.Operation.Grant,
            _this,
            _newParent,
            PermissionLib.NO_CONDITION,
            INTERVENE_PROPOSAL_PERMISSION_ID
        );

        //-- if not _hardLink then grant child dao to call setParent on plugin
        permissions[2] = PermissionLib.MultiTargetPermission(
            _hardLink
                ? PermissionLib.Operation.Revoke
                : PermissionLib.Operation.Grant,
            _dao,
            _this,
            PermissionLib.NO_CONDITION,
            SET_PARENT_PERMISSION_ID
        );

        DAO(payable(_dao)).applyMultiTargetPermissions(permissions);

        parent = _newParent;
        hardLink = _hardLink;

        emit ParentSet(_newParent, _dao, hardLink);
    }

    modifier isActivated() {
        if (deactivated) {
            revert PluginDeactivated();
        }
        _;
    }
}
