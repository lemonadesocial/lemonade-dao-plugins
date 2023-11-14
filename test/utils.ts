import { ethers } from "hardhat";

export const daoExampleURI = "https://example.com";

export async function deployNewDAO(ownerAddress: string) {
  const DAO = await ethers.getContractFactory("DAO");
  let dao = await DAO.deploy();
  await dao.deployed();

//   await dao.initialize(
//     "0x00",
//     ownerAddress,
//     ethers.constants.AddressZero,
//     daoExampleURI
//   );

  return dao;
}
