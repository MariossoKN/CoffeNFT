// withdraws all ETH on the contract
// can only be called by the owner of the contract (deployer)
// run with "yarn hardhat run scripts/withdraw.js --network sepolia"

const { ethers } = require("hardhat")

async function withdraw() {
    const coffeNft = await ethers.getContract("CoffeNft")

    await coffeNft.withdraw()
    console.log("--------------------------------------")
    console.log("All ETH withdrawed from the contract.")
    console.log("--------------------------------------")
}

withdraw()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
