const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper.hardhat.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CoffeNft unit test", async function () {
          let deployer,
              vrfCoordinatorV2Mock,
              coffeNft,
              vrfCoordinatorAddress,
              gasLane,
              subId,
              requestConfirmations,
              callbackGasLimit,
              mintPrice,
              notEnoughMintPrice,
              currentSupply,
              reservedSupply,
              totalSupply,
              mintPrice2x,
              tokenUri
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "coffeNft"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              coffeNft = await ethers.getContract("CoffeNft", deployer)
              vrfCoordinatorAddress = await coffeNft.getVrfCoordinatorAddress()
              gasLane = await coffeNft.getGasLane()
              subId = await coffeNft.getSubId()
              requestConfirmations = await coffeNft.getRequestConfirmations()
              callbackGasLimit = await coffeNft.getCallbackGasLimit()
              mintPrice = await coffeNft.getMintPrice()
              maxMintAmount = (await coffeNft.getMaxMintAmount()).div("1000000000000000000")
              totalSupply = await coffeNft.getTotalSupply()
              reservedSupply = await coffeNft.getReservedSupply()
              currentSupply = await coffeNft.getCurrentSupply()
              notEnoughMintPrice = mintPrice.div(10)
              mintPrice2x = mintPrice.mul(2)
              tokenUri = await coffeNft.getTokenUris()
          })
          describe("Constructor", function () {
              it("Initializes the constructor parameters correctly", async function () {
                  //   console.log(`VRFCoordinator address: ${vrfCoordinatorAddress}`)
                  assert.equal(vrfCoordinatorAddress.toString(), vrfCoordinatorV2Mock.address)
                  //   console.log(`Gas lane: ${gasLane.toString()}`)
                  assert.equal(gasLane, networkConfig[network.config.chainId]["gasLane"])
                  //   console.log(`Sub ID: ${subId.toString()}`)
                  assert.equal(subId.toString(), networkConfig[network.config.chainId]["subId"])
                  //   console.log(`Request confirmations: ${requestConfirmations.toString()}`)
                  assert.equal(
                      requestConfirmations.toString(),
                      networkConfig[network.config.chainId]["requestConfirmations"]
                  )
                  // console.log(`Callback gas limit: ${callbackGasLimit.toString()}`)
                  assert.equal(
                      callbackGasLimit.toString(),
                      networkConfig[network.config.chainId]["callbackGasLimit"]
                  )
                  // console.log(`Mint price: ${mintPrice.toString()}`)
                  assert.equal(
                      mintPrice.toString(),
                      networkConfig[network.config.chainId]["mintPrice"]
                  )
                  // console.log(`Num words: ${mintPrice.toString()}`)
                  //   console.log(`Total supply: ${totalSupply.toString()}`)
                  assert.equal(
                      totalSupply.toString(),
                      networkConfig[network.config.chainId]["totalSupply"]
                  )
                  //   console.log(`Reserved supply: ${reservedSupply.toString()}`)
                  assert.equal(
                      reservedSupply.toString(),
                      networkConfig[network.config.chainId]["reservedSupply"]
                  )
                  //   console.log(`Max mint amount: ${maxMintAmount.toString()}`)
                  assert.equal(
                      maxMintAmount.mul("1000000000000000000").toString(),
                      networkConfig[network.config.chainId]["maxMintAmount"]
                  )
                  assert.equal(
                      tokenUri.toString(),
                      networkConfig[network.config.chainId]["tokenUri"]
                  )
              })
              it("Mint status should start as not active", async function () {
                  assert.equal(await coffeNft.getMintStatus(), false)
              })
          })
          describe("requestNft", function () {
              it("Should revert if mint amount is less then 1 or more then max amount", async function () {
                  await coffeNft.setMintStatusOpen()
                  await expect(coffeNft.requestNft("0", { value: mintPrice })).to.be.reverted
                  await expect(
                      coffeNft.requestNft(maxMintAmount + 1, {
                          value: mintPrice.mul(maxMintAmount + 1),
                      })
                  ).to.be.revertedWith("CoffeNft__WrongMintAmount")
              })
              it("Should revert if mint status is not active", async function () {
                  //   console.log(await coffeNft.getMintStatus())
                  await expect(coffeNft.requestNft("1", { value: mintPrice })).to.be.revertedWith(
                      "CoffeNft__MintNotActive"
                  )
              })
              it("Should revert if not enought ETH is sent", async function () {
                  await coffeNft.setMintStatusOpen()
                  //   console.log(await coffeNft.getMintStatus())
                  await expect(coffeNft.requestNft("1")).to.be.revertedWith(
                      "CoffeNft__NotEnoughEthSent"
                  )
                  await expect(
                      coffeNft.requestNft("1", { value: notEnoughMintPrice })
                  ).to.be.revertedWith("CoffeNft__NotEnoughEthSent")
                  //   console.log(await coffeNft.getMintAmount(deployer))
                  await expect(coffeNft.requestNft("2", { value: mintPrice })).to.be.revertedWith(
                      "CoffeNft__NotEnoughEthSent"
                  )
              })
              it("Should revert if mint amount reached", async function () {
                  const accounts = await ethers.getSigners()
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(1)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(BigInt(tokenIds), maxMintAmount)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          await coffeNft.setMintStatusOpen()
                          const accountConnected = await coffeNft.connect(accounts[1])
                          const requestNftResponse = await accountConnected.requestNft(
                              maxMintAmount,
                              {
                                  value: mintPrice.mul(maxMintAmount),
                              }
                          )
                          console.log(`Requesting ${maxMintAmount} NFT...`)
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
                  await expect(
                      coffeNft.connect(accounts[1]).requestNft("1", { value: mintPrice })
                  ).to.be.revertedWith("CoffeNft__MaxMintAmountReached")
              })
              it("Should revert if total supply reached", async function () {
                  const accounts = await ethers.getSigners()
                  await coffeNft.setMintStatusOpen()
                  //   console.log(BigInt(await coffeNft.getCurrentSupply()))

                  for (i = 1; i < 4; i++) {
                      await new Promise(async (resolve, reject) => {
                          coffeNft.once("NftMinted", async () => {
                              try {
                                  const tokenUri = await coffeNft.tokenURI(i)
                                  assert.equal(tokenUri.toString().includes("ipfs://"), true)
                                  console.log(`Token URI: ${tokenUri.toString()}`)
                                  const tokenIds = await coffeNft.getTokenIds()
                                  assert.equal(tokenIds, maxMintAmount * i)
                                  resolve()
                              } catch (e) {
                                  console.log(e)
                                  reject(e)
                              }
                          })
                          try {
                              const accountConnected = await coffeNft.connect(accounts[i])
                              const requestNftResponse = await accountConnected.requestNft(
                                  maxMintAmount,
                                  {
                                      value: mintPrice.mul(maxMintAmount),
                                  }
                              )
                              console.log(`Requesting ${maxMintAmount} NFT...`)
                              const requestNftReceipt = await requestNftResponse.wait(1)
                              await vrfCoordinatorV2Mock.fulfillRandomWords(
                                  requestNftReceipt.events[1].args.requestId,
                                  coffeNft.address
                              )
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                  }
                  //   console.log(BigInt(await coffeNft.getCurrentSupply()))

                  await expect(
                      coffeNft.requestNft("3", { value: mintPrice.mul(maxMintAmount) })
                  ).to.be.revertedWith("CoffeNft__SorryWeAreOutOfCoffe")
              })
              it("Should emit an event", async function () {
                  await coffeNft.setMintStatusOpen()
                  await expect(coffeNft.requestNft("2", { value: mintPrice2x })).to.emit(
                      coffeNft,
                      "NftRequested"
                  )
              })
          })
          describe("fulfillRandomWords", function () {
              it("Should add to the current supply after succesful mint", async function () {
                  await coffeNft.setMintStatusOpen()
                  const currentStartingSupply = await coffeNft.getCurrentSupply()
                  //   console.log(`Current starting supply: ${currentStartingSupply.toString()}`)
                  //   console.log(`Reserved supply (start): ${await coffeNft.getReservedSupply()}`)
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(1)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(BigInt(tokenIds), maxMintAmount)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          await coffeNft.setMintStatusOpen()
                          const requestNftResponse = await coffeNft.requestNft(maxMintAmount, {
                              value: mintPrice.mul(maxMintAmount),
                          })
                          console.log(`Requesting ${maxMintAmount} NFT...`)
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                          console.log(`Waiting for the promise to resolve...`)
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
                  const currentEndingSupply = await coffeNft.getCurrentSupply()
                  //   console.log(
                  //       `Current ending supply after minting ${maxMintAmount} tokens: ${currentEndingSupply.toString()}`
                  //   )
                  assert.equal(
                      currentEndingSupply.toString(),
                      currentStartingSupply.add("3000000000000000000").toString()
                  )
              })
              it("Should update the amount minted", async function () {
                  const amountMinted = await coffeNft.getMintAmount(deployer)
                  assert.equal(amountMinted.toString(), "0")
                  await coffeNft.setMintStatusOpen()
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(3)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(BigInt(tokenIds), maxMintAmount)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const requestNftResponse = await coffeNft.requestNft(maxMintAmount, {
                              value: mintPrice.mul(maxMintAmount),
                          })
                          console.log(`Requesting ${maxMintAmount} NFT...`)
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
                  const amountMinted2 = await coffeNft.getMintAmount(deployer)
                  assert.equal(amountMinted2.toString(), "3")

                  const accounts = await ethers.getSigners()
                  const amountMinted3 = await coffeNft.getMintAmount(accounts[1].address)
                  assert.equal(amountMinted3.toString(), "0")
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(5)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(BigInt(tokenIds), "5")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const accountConnected = await coffeNft.connect(accounts[1])
                          const requestNftResponse = await accountConnected.requestNft("2", {
                              value: mintPrice.mul(2),
                          })
                          console.log(`Requesting ${"2"} NFT...`)
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
                  const amountMinted4 = await coffeNft.getMintAmount(accounts[1].address)
                  assert.equal(amountMinted4.toString(), "2")
              })
              it("Should update the reserved supply if called by mintReservedSupply function", async function () {
                  const reservedStartingSupply = await coffeNft.getReservedSupply()
                  assert.equal(
                      reservedStartingSupply.toString(),
                      networkConfig[network.config.chainId]["reservedSupply"]
                  )
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(1)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(BigInt(tokenIds), "2")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const requestNftResponse = await coffeNft.mintReservedSupply("2")
                          console.log(`Requesting ${"2"} NFT...`)
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
                  const reservedEndingSupply = await coffeNft.getReservedSupply()
                  assert.equal(reservedEndingSupply.toString(), "0")
              })
              it("Should not update the reserved supply if called by requestNft function", async function () {
                  await coffeNft.setMintStatusOpen()
                  const reservedStartingSupply = await coffeNft.getReservedSupply()
                  assert.equal(
                      reservedStartingSupply.toString(),
                      networkConfig[network.config.chainId]["reservedSupply"]
                  )
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(1)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(BigInt(tokenIds), "2")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const requestNftResponse = await coffeNft.requestNft("2", {
                              value: mintPrice.mul(2),
                          })
                          console.log(`Requesting ${"2"} NFT...`)
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
                  const reservedEndingSupply = await coffeNft.getReservedSupply()
                  assert.equal(
                      reservedEndingSupply.toString(),
                      networkConfig[network.config.chainId]["reservedSupply"]
                  )
              })
              it("Mints an NFT and assigns an uri after random number is returned #1", async function () {
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(1)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(tokenIds, "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          await coffeNft.setMintStatusOpen()
                          const requestNftResponse = await coffeNft.requestNft("1", {
                              value: mintPrice,
                          })
                          console.log("Requesting 1x NFT...")
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                          console.log(`Waiting for the promise to resolve...`)
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
              it("Mints an NFT and assigns an uri after random number is returned #2", async function () {
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(1)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              const tokenUri2 = await coffeNft.tokenURI(2)
                              assert.equal(tokenUri2.toString().includes("ipfs://"), true)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(tokenIds, "2")
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              console.log(`Token URI 2: ${tokenUri2.toString()}`)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          await coffeNft.setMintStatusOpen()
                          const requestNftResponse = await coffeNft.requestNft("2", {
                              value: mintPrice2x,
                          })
                          console.log("Requesting 2x NFT...")
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
          describe("pickRandomNft", function () {
              it("Returns an URI according to the number passed", async function () {
                  const tokenUri1 = await coffeNft.pickRandomNft("11")
                  //   console.log(`TokenUri (11): ${tokenUri1.toString()}`)
                  assert.equal(tokenUri1.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri1.toString().includes("2.json"), true)

                  const tokenUri5 = await coffeNft.pickRandomNft("29")
                  //   console.log(`TokenUri (29): ${tokenUri5.toString()}`)
                  assert.equal(tokenUri5.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri5.toString().includes("2.json"), true)

                  const tokenUri2 = await coffeNft.pickRandomNft("0")
                  //   console.log(`TokenUri (0): ${tokenUri2.toString()}`)
                  assert.equal(tokenUri2.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri2.toString().includes("1.json"), true)

                  const tokenUri6 = await coffeNft.pickRandomNft("9")
                  //   console.log(`TokenUri (9): ${tokenUri6.toString()}`)
                  assert.equal(tokenUri6.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri6.toString().includes("1.json"), true)

                  const tokenUri3 = await coffeNft.pickRandomNft("99")
                  //   console.log(`TokenUri (99): ${tokenUri3.toString()}`)
                  assert.equal(tokenUri3.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri3.toString().includes("4.json"), true)

                  const tokenUri7 = await coffeNft.pickRandomNft("61")
                  //   console.log(`TokenUri (61): ${tokenUri7.toString()}`)
                  assert.equal(tokenUri7.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri7.toString().includes("4.json"), true)

                  const tokenUri4 = await coffeNft.pickRandomNft("59")
                  //   console.log(`TokenUri (59): ${tokenUri4.toString()}`)
                  assert.equal(tokenUri4.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri4.toString().includes("3.json"), true)

                  const tokenUri8 = await coffeNft.pickRandomNft("31")
                  //   console.log(`TokenUri (31): ${tokenUri8.toString()}`)
                  assert.equal(tokenUri8.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri8.toString().includes("3.json"), true)
              })
          })
          describe("pickRandomNftCheaper", function () {
              it("Returns an URI according to the number passed", async function () {
                  const tokenUri1 = await coffeNft.pickRandomNftCheaper("11")
                  console.log(`TokenUri (11): ${tokenUri1.toString()}`)
                  assert.equal(tokenUri1.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri1.toString().includes("2.json"), true)

                  const tokenUri5 = await coffeNft.pickRandomNftCheaper("29")
                  console.log(`TokenUri (29): ${tokenUri5.toString()}`)
                  assert.equal(tokenUri5.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri5.toString().includes("2.json"), true)

                  const tokenUri2 = await coffeNft.pickRandomNftCheaper("0")
                  console.log(`TokenUri (0): ${tokenUri2.toString()}`)
                  assert.equal(tokenUri2.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri2.toString().includes("1.json"), true)

                  const tokenUri6 = await coffeNft.pickRandomNftCheaper("9")
                  console.log(`TokenUri (9): ${tokenUri6.toString()}`)
                  assert.equal(tokenUri6.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri6.toString().includes("1.json"), true)

                  const tokenUri3 = await coffeNft.pickRandomNftCheaper("99")
                  console.log(`TokenUri (99): ${tokenUri3.toString()}`)
                  assert.equal(tokenUri3.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri3.toString().includes("4.json"), true)

                  const tokenUri7 = await coffeNft.pickRandomNftCheaper("61")
                  console.log(`TokenUri (61): ${tokenUri7.toString()}`)
                  assert.equal(tokenUri7.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri7.toString().includes("4.json"), true)

                  const tokenUri4 = await coffeNft.pickRandomNftCheaper("59")
                  console.log(`TokenUri (59): ${tokenUri4.toString()}`)
                  assert.equal(tokenUri4.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri4.toString().includes("3.json"), true)

                  const tokenUri8 = await coffeNft.pickRandomNftCheaper("31")
                  console.log(`TokenUri (31): ${tokenUri8.toString()}`)
                  assert.equal(tokenUri8.toString().includes("ipfs://"), true)
                  assert.equal(tokenUri8.toString().includes("3.json"), true)
              })
          })
          describe("mintReservedSupply", function () {
              it("Should revert if called by not owner", async function () {
                  const accounts = await ethers.getSigners()
                  const accConnected = await coffeNft.connect(accounts[1])
                  await expect(accConnected.mintReservedSupply("1")).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })
              it("Should revert if reserved supply is fully minted", async function () {
                  // this test is set up for 2 (10**18) token reserved supply
                  //   console.log(`Reserved starting supply: ${await coffeNft.getReservedSupply()}`)
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.tokenURI(1)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(tokenIds, "2")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          await coffeNft.setMintStatusOpen()
                          const requestNftResponse = await coffeNft.mintReservedSupply("2")
                          console.log(`Requesting ${"2"} NFT...`)
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              coffeNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
                  //   console.log(`Reserved ending supply: ${await coffeNft.getReservedSupply()}`)
                  //   await coffeNft.mintReservedSupply("1")
                  await expect(coffeNft.mintReservedSupply("1")).to.be.reverted
              })
          })
          describe("changeMintStatus", function () {
              it("Should change the mint status", async function () {
                  assert.equal(await coffeNft.getMintStatus(), false)
                  await coffeNft.setMintStatusOpen()
                  assert.equal(await coffeNft.getMintStatus(), true)
                  await coffeNft.setMintStatusClose()
                  assert.equal(await coffeNft.getMintStatus(), false)
                  await coffeNft.setMintStatusOpen()
                  assert.equal(await coffeNft.getMintStatus(), true)
              })
          })
          describe("setTokenUris", function () {
              it("Shouls set a new tokenUris", async function () {
                  const newUriArray = "ipfs://something/1.json"
                  await coffeNft.setTokenUri(newUriArray)
                  assert.equal(await coffeNft.getTokenUris(), newUriArray)
              })
          })
          describe("withdraw function:", function () {
              beforeEach(async function () {
                  await coffeNft.setMintStatusOpen()
                  await coffeNft.requestNft("1", { value: mintPrice })
              })
              it("Should revert if called by not owner", async function () {
                  const accounts = await ethers.getSigners()
                  const accConnected = await coffeNft.connect(accounts[1])
                  await expect(accConnected.withdraw()).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })
              it("Should withdraw eth from 1 minter", async function () {
                  const ownerStartingBalance = await ethers.provider.getBalance(deployer)
                  //   console.log(`Owner st. balance: ${ownerStartingBalance.toString()}`)
                  const contractStartingBalance = await ethers.provider.getBalance(coffeNft.address)
                  //   console.log(`Contract st. balance: ${contractStartingBalance.toString()}`)
                  const transactionRespone = await coffeNft.withdraw()
                  const transactionReceipt = await transactionRespone.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed * effectiveGasPrice

                  const ownerEndingBalance = await ethers.provider.getBalance(deployer)
                  //   console.log(`Owner end. balance: ${ownerEndingBalance.toString()}`)
                  const contractEndingBalance = await ethers.provider.getBalance(coffeNft.address)
                  //   console.log(`Contract end. balance: ${contractEndingBalance.toString()}`)
                  assert.equal(
                      ownerStartingBalance.sub(gasCost).add(contractStartingBalance).toString(),
                      ownerEndingBalance.toString()
                  )
                  assert.equal(contractEndingBalance, 0)
              })
              it("Should withdraw eth from multiple minters", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 7; i++) {
                      const accountConnected = await coffeNft.connect(accounts[i])
                      await accountConnected.requestNft("1", { value: mintPrice })
                  }
                  const ownerStartingBalance = await ethers.provider.getBalance(deployer)
                  //   console.log(`Owner st. balance: ${ownerStartingBalance.toString()}`)
                  const contractStartingBalance = await ethers.provider.getBalance(coffeNft.address)
                  //   console.log(`Contract st. balance: ${contractStartingBalance.toString()}`)

                  const transactionRespone = await coffeNft.withdraw()
                  const transactionReceipt = await transactionRespone.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed * effectiveGasPrice
                  const ownerEndingBalance = await ethers.provider.getBalance(deployer)
                  //   console.log(`Owner end. balance: ${ownerEndingBalance.toString()}`)
                  const contractEndingBalance = await ethers.provider.getBalance(coffeNft.address)
                  //   console.log(`Contract end. balance: ${contractEndingBalance.toString()}`)

                  assert.equal(contractEndingBalance, 0)
                  assert.equal(
                      ownerStartingBalance.sub(gasCost).add(contractStartingBalance).toString(),
                      ownerEndingBalance.toString()
                  )
              })
          })
      })
