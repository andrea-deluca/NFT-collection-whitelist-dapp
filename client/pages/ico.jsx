import {useEffect, useRef, useState} from "react";
import {BigNumber, Contract, providers, utils} from "ethers";
import {cryptoDevsABI, cryptoDevsTokenABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS} from "@/constants";
import Web3Modal from "web3modal";
import Head from "next/head";
import {Footer, Navbar} from "@/components";
import {Alert, Button, Label, Spinner, TextInput} from "flowbite-react";
import Image from "next/image";

const Ico = () => {
    // Create a BigNumber `0`
    const zero = BigNumber.from(0)
    // walletConnected keeps track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false)
    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(false)
    // tokensToBeClaimed keeps track of the number of tokens that can be claimed
    // based on the Crypto Dev NFT's held by the user for which they haven't claimed the tokens
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero)
    // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
    const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero)
    // amount of the tokens that the user wants to mint
    const [tokenAmount, setTokenAmount] = useState(zero)
    // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
    const [tokensMinted, setTokendsMinted] = useState(zero)
    // isOwner gets the owner of the contract through the signed address
    const [isOwner, setIsOwner] = useState(false)
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef()

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
     * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
     */
    const getTokensToBeClaimed = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner()
            // Create an instance of NFT Contract
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, cryptoDevsABI, provider)
            // Create an instance of tokenContract
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, cryptoDevsTokenABI, provider)
            // We will get the signer now to extract the address of the currently connected MetaMask account
            const signer = await getProviderOrSigner(true)
            // Get the address associated to the signer which is connected to  MetaMask
            const address = await signer.getAddress()
            // call the balanceOf from the NFT contract to get the number of NFT's held by the user
            const balance = await nftContract.balanceOf(address)
            // balance is a Big number and thus we would compare it with Big number `zero`
            if (balance === zero) setTokensToBeClaimed(zero)
            else {
                // amount keeps track of the number of unclaimed tokens
                let amount = 0
                // For all the NFT's, check if the tokens have already been claimed
                // Only increase the amount if the tokens have not been claimed
                // for an NFT(for a given tokenId)
                for (let i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(address, i)
                    const claimed = await tokenContract.tokenIdsClaimed(tokenId)
                    if (!claimed) amount++;
                }
                //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
                // to a big number and then set its value
                setTokensToBeClaimed(BigNumber.from(amount))
            }
        } catch (err) {
            setTokensToBeClaimed(zero)
            console.error(err)
        }
    }

    /**
     * getBalanceOfCryptoDevTokens: checks the balance of Crypto Dev Tokens's held by an address
     */
    const getBalanceOfCryptoDevTokens = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner()
            // Create an instance of token contract
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, cryptoDevsTokenABI, provider)
            // We will get the signer now to extract the address of the currently connected MetaMask account
            const signer = await getProviderOrSigner(true)
            // Get the address associated to the signer which is connected to  MetaMask
            const address = await signer.getAddress()
            // call the balanceOf from the token contract to get the number of tokens held by the user
            const balance = await tokenContract.balanceOf(address)
            // balance is already a big number, so we don't need to convert it before setting it
            setBalanceOfCryptoDevTokens(balance)
        } catch (err) {
            setBalanceOfCryptoDevTokens(zero)
            console.error(err)
        }
    }

    /**
     * mintCryptoDevToken: mints `amount` number of tokens to a given address
     */
    const mintCryptoDevToken = async (amount) => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            // Create an instance of tokenContract
            const signer = await getProviderOrSigner(true);
            // Create an instance of tokenContract
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, cryptoDevsTokenABI, signer)
            // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
            const value = amount * 0.001
            const tx = await tokenContract.mint(amount, {
                // value signifies the cost of one crypto dev token which is "0.001" eth.
                // We are parsing `0.001` string to ether using the utils library from ethers.js
                value: utils.parseEther(value.toString())
            })
            setLoading(true)
            // wait for the transaction to get mined
            await tx.wait()
            setLoading(false)
            window.alert("Successfully minted Crypto Dev Tokens")
            await getBalanceOfCryptoDevTokens()
            await getTotalTokensMinted()
            await getTokensToBeClaimed()
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * claimCryptoDevTokens: Helps the user claim Crypto Dev Tokens
     */
    const claimCryptoDevTokens = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            // Create an instance of tokenContract
            const signer = await getProviderOrSigner(true)
            // Create an instance of tokenContract
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, cryptoDevsTokenABI, signer)
            const tx = await tokenContract.claim()
            setLoading(true)
            // wait for the transaction to get mined
            await tx.wait()
            setLoading(false)
            window.alert("Successfully claimed Crypto Dev Tokens")
            await getBalanceOfCryptoDevTokens()
            await getTotalTokensMinted()
            await getTokensToBeClaimed()
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * getTotalTokensMinted: Retrieves how many tokens have been minted till now
     * out of the total supply
     */
    const getTotalTokensMinted = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner()
            // Create an instance of token contract
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, cryptoDevsTokenABI, provider)
            // Get all the tokens that have been minted
            const _tokensMinted = await tokenContract.totalSupply();
            setTokendsMinted(_tokensMinted)
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * getOwner: gets the contract owner by connected address
     */
    const getOwner = async () => {
        try {
            const provider = await getProviderOrSigner()
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, cryptoDevsTokenABI, provider)
            // call the owner function from the contract
            const _owner = await tokenContract.owner()
            // we get signer to extract address of currently connected Metamask account
            const signer = await getProviderOrSigner(true)
            // Get the address associated to signer which is connected to Metamask
            const address = await signer.getAddress()
            if (address.toLowerCase() === _owner.toLowerCase()) setIsOwner(true)
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * withdrawCoins: withdraws ether by calling
     * the withdraw function in the contract
     */
    const withdrawCoins = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, cryptoDevsTokenABI, signer)
            const tx = await tokenContract.withdraw()
            setLoading(true)
            await tx.wait()
            setLoading(false)
            await getOwner()
        } catch (err) {
            console.error(err)
            window.alert(err.reason)
        }
    }

    /*
    connectWallet: Connects the MetaMask wallet
    */
    const connectWallet = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // When used for the first time, it prompts the user to connect their wallet
            await getProviderOrSigner()
            setWalletConnected(true)
        } catch (err) {
            console.error(err)
        }
    }

    // useEffects are used to react to changes in state of the website
    // The array at the end of function call represents what state changes will trigger this effect
    // In this case, whenever the value of `walletConnected` changes - this effect will be called
    useEffect(() => {
        // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
        if (!walletConnected) {
            // Assign the Web3Modal class to the reference object by setting it's `current` value
            // The `current` value is persisted throughout as long as this page is open
            web3ModalRef.current = new Web3Modal({
                network: "sepolia",
                providerOptions: {},
                disableInjectedProvider: false
            })
            Promise.all([
                connectWallet(),
                getTotalTokensMinted(),
                getBalanceOfCryptoDevTokens(),
                getTokensToBeClaimed(),
                getOwner(),
            ]).finally(() => setLoadPage(false))
        }
    }, [walletConnected])

    /*
    renderButton: Returns a button based on the state of the dapp
    */
    const renderButton = () => {
        // If tokens to be claimed are greater than 0, Return a claim button
        if (tokensToBeClaimed > 0)
            return <div className={"flex flex-col space-y-4 items-center"}>
                <div className="text-emerald-600 font-bold text-xl">
                    <p>{tokensToBeClaimed * 10} Tokens can be claimed!</p>
                </div>
                <Button size={"xl"} gradientMonochrome="info" onClick={claimCryptoDevTokens}
                        disabled={loading}>
                    {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                    Claim tokens
                </Button>
            </div>

        // If user doesn't have any tokens to claim, show the mint button
        return <div className={"flex flex-col space-y-6"}>
            <div className={"flex flex-col space-y-2"}>
                <Label for={"token-amount"}>How many tokens would you like to mint?</Label>
                <TextInput
                    id={"token-amount"}
                    type={"number"}
                    placeholder="Amount of Tokens"
                    // BigNumber.from converts the `e.target.value` to a BigNumber
                    onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
                />
            </div>
            <Button size={"xl"} gradientMonochrome="info" onClick={() => mintCryptoDevToken(tokenAmount)}
                    disabled={loading || !(tokenAmount > 0)}>
                {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                Mint tokens
            </Button>
        </div>
    }

    if (!loadPage)
        return (
            <>
                <Head>
                    <title>Crypto Devs | ICO</title>
                    <meta name="description" content="ICO-Dapp"/>
                    <link rel="icon" href="/favicon.ico"/>
                </Head>
                <Navbar/>
                <main className="h-screen flex flex-col justify-center items-center dark:bg-gray-900 space-y-12">
                    <div className={"text-center"}>
                        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                            Welcome to <mark className="px-2 text-white bg-blue-600 rounded dark:bg-blue-500">Crypto
                            Devs ICO</mark>
                        </h1>
                        <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
                            You can claim or mint Crypto Dev tokens here
                        </p>
                    </div>

                    {walletConnected ? (
                        <div className={"flex flex-col space-y-12 items-center"}>
                            <div className={"flex flex-col space-y-3"}>
                                <Alert color="info" className={"px-16"}>
                            <span className={"font-bold"}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto Dev Tokens
                            </span>
                                </Alert>

                                <Alert color="info" className={"px-16"}>
                            <span className={"font-bold"}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!
                            </span>
                                </Alert>
                            </div>

                            {renderButton()}

                            {/* Display additional withdraw button if connected wallet is owner */}
                            {isOwner && (
                                <Button size={"xl"} gradientMonochrome="failure" onClick={withdrawCoins}
                                        disabled={loading}>
                                    {loading &&
                                        <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                                    Withdraw Coins
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Button color={"gray"} onClick={connectWallet}>
                            <Image width={256} height={256} src="/metamask.svg" className={"w-6 h-5 mr-2 -ml-1"}
                                   alt="Metamask logo"/>
                            Connect with MetaMask
                        </Button>
                    )}
                </main>
                <Footer/>
            </>
        )

    return <div className={"h-screen w-screen flex justify-center items-center dark:bg-gray-900"}>
        <Spinner size={"xl"} aria-label="Loading spinner" className={"dark:text-white"}/>
    </div>
}

export default Ico;