// change the mint status (open / close)
// can only be called by the owner of the contract (deployer)
// run with "yarn hardhat run scripts/setMintStatusClose.js --network sepolia"

const { ethers } = require("hardhat")

async function setMintStatusClose() {
    const coffeNft = await ethers.getContract("CoffeNft")

    await coffeNft.setMintStatusClose()
    console.log("--------------------------------------")
    console.log("Mint status changed to Closed.")
    console.log("--------------------------------------")
}

setMintStatusClose()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
