const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper.hardhat.config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("CoffeNft staging test", async function () {
          let deployer,
              coffeNft,
              mintPrice,
              notEnoughMintPrice,
              currentSupply,
              reservedSupply,
              totalSupply,
              mintPrice2x
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              coffeNft = await ethers.getContract("CoffeNft", deployer)
              gasLane = await coffeNft.getGasLane()
              subId = await coffeNft.getSubId()
              requestConfirmations = await coffeNft.getRequestConfirmations()
              callbackGasLimit = await coffeNft.getCallbackGasLimit()
              mintPrice = await coffeNft.getMintPrice()
              maxMintAmount = (await coffeNft.getMaxMintAmount()).div("1000000000000000000")
              totalSupply = await coffeNft.getTotalSupply()
              reservedSupply = await coffeNft.getReservedSupply()
              currentSupply = await coffeNft.getCurrentSupply()
              notEnoughMintPrice = mintPrice / 10
              mintPrice2x = mintPrice.mul(2)
          })
          //   describe("Constructor", function () {})
          describe("requestNft", async function () {
              it("Should revert if mint status is close", async function () {
                  //   console.log(await coffeNft.getMintStatus())
                  await expect(coffeNft.requestNft("1", { value: mintPrice })).to.be.reverted
              })
              it("Should revert if mint amount is less then 1 or more then max amount", async function () {
                  const tx = await coffeNft.setMintStatusOpen()
                  console.log("Setting the mint status to Open...")
                  await tx.wait(1)
                  await expect(coffeNft.requestNft("0", { value: mintPrice })).to.be.reverted
                  await expect(
                      coffeNft.requestNft(maxMintAmount + 1, {
                          value: mintPrice.mul(maxMintAmount + 1),
                      })
                  ).to.be.reverted
              })

              it("Should revert if not enought ETH is sent", async function () {
                  //   console.log(await coffeNft.getMintStatus())
                  await expect(coffeNft.requestNft("1")).to.be.reverted
                  await expect(coffeNft.requestNft("1", { value: notEnoughMintPrice })).to.be
                      .reverted
                  //   console.log(await coffeNft.getMintAmount(deployer))
                  await expect(coffeNft.requestNft("3", { value: mintPrice2x })).to.be.reverted
              })
              it("Should update the token amount minted and add to current supply", async function () {
                  const startingAmountMinted = await coffeNft.getMintAmount(deployer)
                  const currentStartingSupply = await coffeNft.getCurrentSupply()

                  const tx = await coffeNft.requestNft("1", { value: mintPrice })
                  await tx.wait(1)
                  const endingAmountMinted = await coffeNft.getMintAmount(deployer)
                  assert.equal(startingAmountMinted + 1, endingAmountMinted)

                  const currentEndingSupply = await coffeNft.getCurrentSupply()

                  assert.equal(
                      currentEndingSupply.toString(),
                      currentStartingSupply.add("1000000000000000000").toString()
                  )
              })
              it("Should revert if mint amount reached", async function () {
                  const deployermintAmount = await coffeNft.getMintAmount(deployer)
                  console.log(`Deployer starting mint amount: ${deployermintAmount}`)
                  const maxMintAmountPlusOne = maxMintAmount - deployermintAmount + 1
                  await expect(
                      coffeNft.requestNft(maxMintAmountPlusOne, {
                          value: mintPrice * maxMintAmountPlusOne,
                      })
                  ).to.be.reverted
              })
          })
          describe("fulfillRandomWords", function () {
              it("Mints an NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      coffeNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await coffeNft.getTokenUri(2)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              console.log(`Token URI: ${tokenUri.toString()}`)
                              const tokenIds = await coffeNft.getTokenIds()
                              assert.equal(tokenIds - 2, "1") // tokenIds - 2 because we minted total of 2 tokens and the tokenIds increment right after mint
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const requestNftResponse = await coffeNft.requestNft("1", {
                              value: mintPrice,
                          })
                          console.log("Requesting 1x NFT...")
                          const requestNftReceipt = await requestNftResponse.wait(1)
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
          describe("mintReservedSupply", function () {
              it("Should revert if reserved supply is fully minted", async function () {
                  // this test is set up for 2 (10**18) token reserved supply
                  const reservedStartingSupply = await coffeNft.getReservedSupply()
                  console.log(`Reserved starting supply: ${reservedStartingSupply.toString()}`)
                  const tx = await coffeNft.mintReservedSupply("2")
                  console.log("Minting reserved supply (2 tokens)..")
                  await tx.wait(1)
                  const reservedEndingSupply = await coffeNft.getReservedSupply()
                  console.log(`Reserve ending supply: ${reservedEndingSupply.toString()}`)
                  await expect(coffeNft.mintReservedSupply("1")).to.be.reverted
                  assert.equal(
                      reservedEndingSupply.toString(),
                      reservedStartingSupply.sub("2000000000000000000").toString()
                  )
              })
          })
          describe("changeMintStatus", function () {
              it("Should change the mint status", async function () {
                  const tx = await coffeNft.setMintStatusClose()
                  console.log("Setting the mint status to Close...")
                  await tx.wait(1)
                  assert.equal(await coffeNft.getMintStatus(), false)

                  const tx2 = await coffeNft.setMintStatusOpen()
                  console.log("Setting the mint status to Open...")
                  await tx2.wait(1)
                  assert.equal(await coffeNft.getMintStatus(), true)
              })
          })
          describe("withdraw function:", function () {
              it("Should withdraw all eth", async function () {
                  const ownerStartingBalance = await ethers.provider.getBalance(deployer)
                  console.log(`Owner st. balance: ${ownerStartingBalance.toString()}`)
                  const contractStartingBalance = await ethers.provider.getBalance(coffeNft.address)
                  console.log(`Contract st. balance: ${contractStartingBalance.toString()}`)

                  const transactionRespone = await coffeNft.withdraw()
                  const transactionReceipt = await transactionRespone.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed * effectiveGasPrice
                  const ownerEndingBalance = await ethers.provider.getBalance(deployer)
                  console.log(`Owner end. balance: ${ownerEndingBalance.toString()}`)
                  const contractEndingBalance = await ethers.provider.getBalance(coffeNft.address)
                  console.log(`Contract end. balance: ${contractEndingBalance.toString()}`)

                  assert.equal(contractEndingBalance, "0")
                  assert.equal(
                      ownerStartingBalance.sub(gasCost).add(contractStartingBalance).toString(),
                      ownerEndingBalance.toString()
                  )
              })
          })
      })
