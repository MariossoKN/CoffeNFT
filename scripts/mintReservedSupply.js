// mints random NFT from reserved supply (not payable)
// !!! keep in mind the callbackGasLimit !!!
// recommended to mint in batches then the whole reserved supply at once
// can only be called by the owner of the contract (deployer)
// make sure that the contract address has been added to Chainlink VRF subscription (as consumer)
// specify the amount of NFTs to mint in "amountMinted" parameter
// cant mint more than the total reserved supply
// run with "yarn hardhat run scripts/mintReservedSupply.js --network sepolia"

const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper.hardhat.config")

async function mintReservedSupply() {
    const amountMinted = "5"
    const coffeNft = await ethers.getContract("CoffeNft")

    await coffeNft.mintReservedSupply(amountMinted)
    console.log("-------------------------------------------------------------------------------")
    console.log(`Minted ${amountMinted} token/s from reserved supply.`)
    console.log("Be aware that even if this script went through, the VRF request can still fail.")
    console.log("Check the VRF subscription site to see if the request was successful.")
    console.log("-------------------------------------------------------------------------------")
}

mintReservedSupply()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
