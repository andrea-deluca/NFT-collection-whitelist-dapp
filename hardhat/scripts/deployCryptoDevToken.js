const {ethers} = require("hardhat")
const {CRYPTO_DEVS_NFT_CONTRACT_ADDRESS} = require("../constants")

async function main() {
    /*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so cryptoDevsTokenContract here is a factory for instances of our CryptoDevToken contract.
    */
    const cryptoDevTokenContract = await ethers.getContractFactory("CryptoDevToken");

    // deploy the contract
    const deployedCryptoDevTokenContract = await cryptoDevTokenContract.deploy(CRYPTO_DEVS_NFT_CONTRACT_ADDRESS);

    await deployedCryptoDevTokenContract.deployed();

    // print the address of the deployed contract
    console.log(`Crypto Dev Token Contract Address: ${deployedCryptoDevTokenContract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })