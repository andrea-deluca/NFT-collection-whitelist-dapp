import {
    cryptoDevsTokenABI as TOKEN_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    exchangeABI as EXCHANGE_ABI,
    TOKEN_CONTRACT_ADDRESS
} from "@/constants";
import {Contract} from "ethers";

/**
 * getEtherBalance: Retrieves the ether balance of the user or the contract
 */
export const getEtherBalance = async (provider, address, contract = false) => {
    try {
        // If the caller has set the `contract` boolean to true, retrieve the balance of
        // ether in the `exchange contract`, if it is set to false, retrieve the balance
        // of the user's address
        if (contract)
            return await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS)
        return await provider.getBalance(address)
    } catch (err) {
        console.error(err)
        return 0
    }
}

/**
 * getCDTokensBalance: Retrieves the Crypto Dev tokens in the account
 * of the provided `address`
 */
export const getCDTokensBalance = async (provider, address) => {
    try {
        const contract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, provider)
        return await contract.balanceOf(address)

    } catch (err) {
        console.error(err)
    }
}

/**
 * getLPTokensBalance: Retrieves the amount of LP tokens in the account
 * of the provided `address`
 */
export const getLPTokensBalance = async (provider, address) => {
    try {
        const contract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_ABI, provider)
        return await contract.balanceOf(address)
    } catch (err) {
        console.error(err)
    }
}

/**
 * getReserveOfCDTokens: Retrieves the amount of CD tokens in the
 * exchange contract address
 */
export const getReserveOfCDTokens = async (provider) => {
    try {
        const contract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_ABI, provider)
        return await contract.getReserve()
    } catch (err) {
        console.error(err)
    }
}
