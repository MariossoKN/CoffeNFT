// only use if the verification failed during deployment of the contract
// run with "yarn hardhat run scripts/verifyContract.js --network sepolia"

const { verify } = require("../utils/verify")
const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper.hardhat.config")
const chainId = network.config.chainId

const args = [
    networkConfig[chainId]["vrfCoordinatorAddress"],
    networkConfig[chainId]["gasLane"],
    networkConfig[chainId]["subId"],
    networkConfig[chainId]["requestConfirmations"],
    networkConfig[chainId]["callbackGasLimit"],
    networkConfig[chainId]["mintPrice"],
    networkConfig[chainId]["totalSupply"],
    networkConfig[chainId]["reservedSupply"],
    networkConfig[chainId]["maxMintAmount"],
    networkConfig[chainId]["tokenUri"],
]
async function verifyContract() {
    const coffeNft = await ethers.getContract("CoffeNft")
    await verify(coffeNft.address, args)
}

verifyContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
