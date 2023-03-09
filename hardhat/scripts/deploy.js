const { ethers } = require("hardhat");

async function main() {
    /*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so whitelistContract here is a factory for instances of our Whitelist contract.
    */
    const whitelistContract = await ethers.getContractFactory("Whitelist")

    // Here we deploy the contract
    // 10 is the max number of whitelisted addresses allowed
    const deployedWhitelistContract = await whitelistContract.deploy(10);

    // Wait for it to finish deploying
    await deployedWhitelistContract.deployed();

    // Print the address of the deployed contract
    console.log(`Whitelist Contract Address: ${deployedWhitelistContract.address}`);
}

// Call the main function and catch if there is any error
main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
