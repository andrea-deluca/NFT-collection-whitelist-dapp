const {ethers} = require("hardhat")
const {CRYPTO_DEVS_TOKEN_CONTRACT_ADDRESS} = require("../constants")

async function main() {
    /*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so exchangeContract here is a factory for instances of our Exchange contract.
    */
    const exchangeContract = await ethers.getContractFactory("Exchange")

    // here we deploy the contract
    const deployedExchangeContract = await exchangeContract.deploy(CRYPTO_DEVS_TOKEN_CONTRACT_ADDRESS)
    await deployedExchangeContract.deployed()

    // print the address of the deployed contract
    console.log(`Exchange Contract Address: ${deployedExchangeContract.address}`)
}

// Call the main function and catch if there is any error
main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })