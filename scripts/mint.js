// mint random NFT (payable)
// !!! keep in mind the callbackGasLimit !!!
// make sure that the mintStatus is set to open
// make sure that the contract address has been added to Chainlink VRF subscription (as consumer)
// specify the amount of NFTs to mint in "amountMinted" parameter
// run with "yarn hardhat run scripts/mint.js --network sepolia"

const { ethers } = require("hardhat")

async function mint() {
    const amountMinted = "3"
    const coffeNft = await ethers.getContract("CoffeNft")
    const mintPrice = await coffeNft.getMintPrice()

    await coffeNft.requestNft(amountMinted, { value: BigInt(mintPrice) * BigInt(amountMinted) })
    console.log("--------------------------------------")
    console.log(`Minted ${amountMinted} token/s.`)
    console.log("Be aware that even if this script went through, the VRF request can still fail.")
    console.log("Check the VRF subscription site to see if the request was successful.")
    console.log("--------------------------------------")
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
