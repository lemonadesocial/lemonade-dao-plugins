// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import {Plugin, IDAO} from "@aragon/osx/core/plugin/Plugin.sol";

contract GreetPlugin is Plugin {
    bytes32 public constant GREET_PERMISSION = keccak256("GREET_PERMISSION");

    constructor(IDAO _dao) Plugin(_dao) {}

    function greet() external view auth(GREET_PERMISSION) returns (string memory) {
        return "Hello, World!";
    }
}
