import { DAO } from "@aragon/osx-ethers"
import { ethers } from "hardhat"
import { deployNewDAO } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ParentChild", () => {
    let parentDAO: DAO;
    let childDAO: DAO;
    let signers: SignerWithAddress[] = [];

    // Setup a DAO
    before(async () => {
        signers = await ethers.getSigners();
        parentDAO = await deployNewDAO(signers[0]);
        childDAO = await deployNewDAO(signers[0]);
    });
})