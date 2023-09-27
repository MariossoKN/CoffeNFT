// change the mint status (open / close)
// can only be called by the owner of the contract (deployer)
// run with "yarn hardhat run scripts/setMintStatusOpen.js --network sepolia"

const { ethers } = require("hardhat")

async function setMintStatusOpen() {
    const coffeNft = await ethers.getContract("CoffeNft")

    await coffeNft.setMintStatusOpen()
    console.log("--------------------------------------")
    console.log("Mint status changed to Open.")
    console.log("--------------------------------------")
}

setMintStatusOpen()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
