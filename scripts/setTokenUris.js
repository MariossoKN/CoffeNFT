// rewrites the current token URIs
// can only be called by the owner of the contract (deployer)
// fill the "newTokenUris" array (size of 4) with new token URI strings
// run with "yarn hardhat run scripts/setTokenUris.js --network sepolia"

const { ethers } = require("hardhat")

const newTokenUris = ["", "", "", ""]

async function setTokenUris() {
    const coffeNft = await ethers.getContract("CoffeNft")

    await coffeNft.setTokenUris(newTokenUris)
    console.log("--------------------------------------")
    console.log("New token URIs set.")
    console.log("--------------------------------------")
}

setTokenUris()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
