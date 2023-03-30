const {ethers} = require("hardhat")
const {CRYPTO_DEVS_NFT_CONTRACT_ADDRESS} = require("../constants")

async function main() {
    // Deploy the FakeNFTMarketplace contract first
    const fakeNFTMarketplaceContract = await ethers.getContractFactory("FakeNFTMarketplace")
    const deployedFakeNFTMarketplaceContract = await fakeNFTMarketplaceContract.deploy()
    await deployedFakeNFTMarketplaceContract.deployed()

    console.log(`FakeNFTMarketplace deployed to: ${deployedFakeNFTMarketplaceContract.address}`)

    // Now deploy the CryptoDevsDAO contract
    const cryptoDevsDAOContract = await ethers.getContractFactory("CryptoDevsDAO")
    const deployedCryptoDevsDAOContract = await cryptoDevsDAOContract.deploy(
        deployedFakeNFTMarketplaceContract.address,
        CRYPTO_DEVS_NFT_CONTRACT_ADDRESS,
        // This assumes your metamask account has at least 1 ETH in its account
        // Change this value as you want
        {value: ethers.utils.parseEther("0.5")}
    )

    await deployedCryptoDevsDAOContract.deployed()

    console.log(`CryptoDevsDAO deployed to: ${deployedCryptoDevsDAOContract.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })