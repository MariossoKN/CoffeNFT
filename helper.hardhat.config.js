const networkConfig = {
    11155111: {
        name: "sepolia",
        vrfCoordinatorAddress: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subId: "1754",
        requestConfirmations: "3",
        callbackGasLimit: "1000000", // tested with max 5 random words
        mintPrice: ethers.utils.parseEther("0.01"),
        totalSupply: "1000000000000000000000",
        reservedSupply: "10000000000000000000", // !!! keep in mind what is the max min with the current callbackGasLimit !!!
        maxMintAmount: "3000000000000000000", // if increased, also need to increase the callbackGasLimit
        tokenUri: "ipfs://bafybeih73omsfk6rzjp4hsviaxa2ucpchnnnxpb2bzvgf4dakwbod2rll4",
    },
    31337: {
        name: "hardhat",
        vrfCoordinatorAddress: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subId: "1",
        requestConfirmations: "3",
        callbackGasLimit: "500000",
        mintPrice: ethers.utils.parseEther("0.01"),
        totalSupply: "10000000000000000000",
        reservedSupply: "2000000000000000000",
        maxMintAmount: "3000000000000000000",
        tokenUri: "ipfs://bafybeih73omsfk6rzjp4hsviaxa2ucpchnnnxpb2bzvgf4dakwbod2rll4",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = { networkConfig, developmentChains }
