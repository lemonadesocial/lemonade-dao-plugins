// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.17;

import {Multisig} from "@aragon/osx/plugins/governance/multisig/Multisig.sol";
import {DAOFactory} from "@aragon/osx/framework/dao/DAOFactory.sol";
import {DAORegistry} from "@aragon/osx/framework/dao/DAORegistry.sol";
import {DAO} from "@aragon/osx/core/dao/DAO.sol";
import {PluginSetupProcessor} from "@aragon/osx/framework/plugin/setup/PluginSetupProcessor.sol";
import {PluginRepoRegistry} from "@aragon/osx/framework/plugin/repo/PluginRepoRegistry.sol";
import {PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";
import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";

contract SubDAOCreator is PluginUUPSUpgradeable {
    DAOFactory private _daoFactory;

    bytes32 public constant CREATE_SUBDAO_PERMISSION_ID =
        keccak256("CREATE_SUBDAO_PERMISSION");

    /// @notice The [ERC-165](https://eips.ethereum.org/EIPS/eip-165) interface ID of the contract.
    bytes4 internal constant SUBDAO_CREATOR_INTERFACE_ID =
        this.initialize.selector ^
            this.createSubDao.selector ^
            this.assignParent.selector ^
            this.removeParent.selector;

    address internal parentDAO;
    DAO internal currentDAO;

    constructor() {
        // TODO: Fix hardcoded mumbai addresses
        address registry = address(bytes20(bytes("0x6dD0C8b7F9406206ceAA01B5576D9d46e9298f0E")));
        address pluginSetupProcessor = address(bytes20(bytes("0x9227b311C5cecB416707F1C8B7Ca1b52649AabEc")));

        _daoFactory = new DAOFactory(DAORegistry(registry), PluginSetupProcessor(pluginSetupProcessor));
    }

    function initialize(DAO _dao) external initializer {
        __PluginUUPSUpgradeable_init(_dao);

        currentDAO = _dao;
    }

    function supportsInterface(
        bytes4 _interfaceId
    ) public view override(PluginUUPSUpgradeable) returns (bool) {
        return
            _interfaceId == SUBDAO_CREATOR_INTERFACE_ID ||
            PluginUUPSUpgradeable.supportsInterface(_interfaceId) ||
            super.supportsInterface(_interfaceId);
    }

    function createSubDao(
        DAOFactory.DAOSettings calldata _daoSettings,
        DAOFactory.PluginSettings[] calldata _pluginSettings
    ) external auth(CREATE_SUBDAO_PERMISSION_ID) returns (DAO createdDao) {
        createdDao = _daoFactory.createDao(_daoSettings, _pluginSettings);

        // Grant EXECUTE permission on the created DAO to the current DAO (parent)
        createdDao.grant(
            address(createdDao),
            address(currentDAO),
            createdDao.EXECUTE_PERMISSION_ID()
        );
    }

    function assignParent(address _parentDAO) external {
        parentDAO = _parentDAO;

        // Grant EXECUTE permission on the current DAO to the parent DAO
        currentDAO.grant(
            _parentDAO,
            address(currentDAO),
            currentDAO.EXECUTE_PERMISSION_ID()
        );
    }

    function removeParent() external {
        // Revoke EXECUTE permission on the current DAO from the parent DAO
        currentDAO.revoke(
            parentDAO,
            address(currentDAO),
            currentDAO.EXECUTE_PERMISSION_ID()
        );
        parentDAO = address(0);
    }

    /// @notice This empty reserved space is put in place to allow future versions to add new variables without shifting down storage in the inheritance chain (see [OpenZeppelin's guide about storage gaps](https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps)).
    uint256[50] private __gap;
}
