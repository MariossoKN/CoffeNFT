// burns the NFT
// fill the "tokenId" parameter with the NFT token id
// run with "yarn hardhat run scripts/burnNft.js --network sepolia"

const { ethers } = require("hardhat")

const tokenId = ""

async function _burn() {
    const coffeNft = await ethers.getContract("CoffeNft")

    await coffeNft._burn(tokenId)
    console.log("--------------------------------------")
    console.log(`NFT token ID ${tokenId} burned.`)
    console.log("--------------------------------------")
}

_burn()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
