import {useEffect, useRef, useState} from "react";
import Head from 'next/head'
import Image from 'next/image'

import {Alert, Button, Spinner} from 'flowbite-react'

import Web3Modal from 'web3modal'
import {Contract, providers} from 'ethers'

import {WHITELIST_CONTRACT_ADDRESS, whitelistABI as abi} from "@/constants";
import {Footer, Navbar} from "@/components";

export default function Home() {
    // walletConnected keep track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false);
    // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
    const [joinedWhitelist, setJoinedWhitelist] = useState(false);
    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(true);
    // numberOfWhitelisted tracks the number of addresses' whitelisted
    const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(undefined);
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef();

    const [loadPage, setLoadPage] = useState(true)

    /**
     * Returns a Provider or Signer object representing the Ethereum RPC with or without the
     * signing capabilities of metamask attached
     *
     * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
     *
     * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
     * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
     * request signatures from the user using Signer functions.
     *
     * @param {*} needSigner - True if you need the signer, default false otherwise
     */
    const getProviderOrSigner = async (needSigner = false) => {
        // Connect to Metamask
        // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);

        // If user is not connected to the Sepolia network, let them know and throw an error
        const {chainId} = await web3Provider.getNetwork();
        if (chainId !== 11155111) {
            window.alert("Change the network to Sepolia");
            throw new Error("Change network to Sepolia");
        }

        if (needSigner) {
            return web3Provider.getSigner();
        } else return web3Provider;
    }

    /**
     * addAddressToWhitelist: Adds the current connected address to the whitelist
     */
    const addAddressToWhitelist = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            const signer = await getProviderOrSigner(true);
            // Create a new instance of the Contract with a Signer, which allows
            // update methods
            const whitelistContract = new Contract(
                WHITELIST_CONTRACT_ADDRESS,
                abi,
                signer
            );
            // call the addAddressToWhitelist from the contract
            const tx = await whitelistContract.addAddressToWhitelist();
            setLoading(true)
            await tx.wait();
            setLoading(false);
            // get the updated number of addresses in the whitelist
            await getNumberOfWhitelisted();
            setJoinedWhitelist(true);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * getNumberOfWhitelisted:  gets the number of whitelisted addresses
     */
    const getNumberOfWhitelisted = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner();
            // We connect to the Contract using a Provider, so we will only
            // have read-only access to the Contract
            const whitelistContract = new Contract(
                WHITELIST_CONTRACT_ADDRESS,
                abi,
                provider
            );
            // call the numAddressesWhitelisted from the contract
            const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
            setNumberOfWhitelisted(_numberOfWhitelisted);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * checkIfAddressInWhitelist: Checks if the address is in whitelist
     */
    const checkIfAddressInWhitelist = async () => {
        try {
            // We will need the signer later to get the user's address
            // Even though it is a read transaction, since Signers are just special kinds of Providers,
            // We can use it in its place.
            const signer = await getProviderOrSigner(true);
            const whitelistContract = new Contract(
                WHITELIST_CONTRACT_ADDRESS,
                abi,
                signer
            );
            // Get the address associated to the signer which is connected to MetaMask
            const address = await signer.getAddress();
            // call the whitelistedAddresses from the contract
            const _joinedWhitelist = await whitelistContract.whitelistedAddresses(address);
            setJoinedWhitelist(_joinedWhitelist);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * connectWallet: Connects the MetaMask wallet
     */
    const connectWallet = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // When used for the first time, it prompts the user to connect their wallet
            await getProviderOrSigner();
            setWalletConnected(true);

            Promise.all([
                checkIfAddressInWhitelist(),
                getNumberOfWhitelisted()
            ]).finally(() => setLoadPage(false))
        } catch (err) {
            setLoadPage(false)
            console.error(err);
        }
    }

    /**
     * renderButton: Returns a button based on the state of the dapp
     */
    const renderButton = () => {
        if (walletConnected) {
            if (joinedWhitelist) {
                return <div className="text-emerald-400 font-bold text-xl">
                    <p>Thanks for joining the Whitelist!</p>
                </div>
            } else return <Button size={"xl"} gradientMonochrome="info" onClick={addAddressToWhitelist}
                                  disabled={loading}>
                {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                Join the Whitelist
            </Button>
        } else return <Button color={"gray"} onClick={connectWallet}>
            <Image width={256} height={256} src="/metamask.svg" className={"w-6 h-5 mr-2 -ml-1"} alt="Metamask logo"/>
            Connect with MetaMask
        </Button>
    }

    // useEffects are used to react to changes in state of the website
    // The array at the end of function call represents what state changes will trigger this effect
    // In this case, whenever the value of `walletConnected` changes - this effect will be called
    useEffect(() => {
        // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
        if (!walletConnected) {
            // Assign the Web3Modal class to the reference object by setting its `current` value
            // The `current` value is persisted throughout as long as this page is open
            web3ModalRef.current = new Web3Modal({
                network: 'sepolia',
                providerOptions: {},
                disableInjectedProvider: false
            });
            connectWallet()
        } else {
            Promise.all([
                checkIfAddressInWhitelist(),
                getNumberOfWhitelisted()
            ]).finally(() => setLoadPage(false))
        }
    }, [walletConnected])

    if (!loadPage)
        return (
            <>
                <Head>
                    <title>Crypto Devs</title>
                    <meta name="description" content="Demo NFT Collection Whitelist DApp"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Navbar/>
                <main className="h-screen flex flex-col justify-center items-center dark:bg-gray-900 space-y-12">
                    <div className={"text-center"}>
                        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                            Welcome to <mark className="px-2 text-white bg-blue-600 rounded dark:bg-blue-500">Crypto
                            Devs</mark>
                        </h1>
                        <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
                            It is an NFT collection for developers in Crypto.
                        </p>
                    </div>

                    {walletConnected && <Alert color="info" className={"px-16"}>
                    <span className={"font-bold"}>
                    {numberOfWhitelisted} have already joined the Whitelist
                    </span>
                    </Alert>}
                    {renderButton()}
                </main>
                <Footer/>
            </>
        )

    return <div className={"h-screen w-screen flex justify-center items-center dark:bg-gray-900"}>
        <Spinner size={"xl"} aria-label="Loading spinner" className={"dark:text-white"}/>
    </div>
}
