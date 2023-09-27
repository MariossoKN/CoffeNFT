// transfers the NFT from one wallet to other wallet (you have to be the owner of the NFT)
// fill the "ownerAddress" parameter - address of the owner of the NFT
// fill the "tokenId" parameter with the NFT token id
// fill the "newOwnerAddress" parameter - address of the new owner of the NFT
// run with "yarn hardhat run scripts/transferNft.js --network sepolia"

const { ethers } = require("hardhat")

const ownerAddress = ""
const newOwnerAddress = ""
const tokenId = ""

async function safeTransferFrom() {
    const coffeNft = await ethers.getContract("CoffeNft")

    await coffeNft.safeTransferFrom(ownerAddress, newOwnerAddress, tokenId)
    console.log("--------------------------------------")
    console.log(`NFT token ID ${tokenId} sent to ${newOwnerAddress}.`)
    console.log("--------------------------------------")
}

safeTransferFrom()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
