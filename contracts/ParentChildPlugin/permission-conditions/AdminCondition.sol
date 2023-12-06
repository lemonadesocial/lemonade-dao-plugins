// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {PermissionCondition} from "@aragon/osx/core/permission/PermissionCondition.sol";

contract AdminCondition is PermissionCondition {
    address internal parentDao;

    constructor(address _parentDao) {
        parentDao = _parentDao;
    }

    function isGranted(
        address _where,
        address _who,
        bytes32 _permissionId,
        bytes calldata _data
    ) external view override returns (bool isPermitted) {
        (_where, _permissionId, _data);

        if (parentDao == _who) {
            isPermitted = true;
        } else {
            isPermitted = false;
        }
    }
}
