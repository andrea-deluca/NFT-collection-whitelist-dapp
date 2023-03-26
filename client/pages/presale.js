import {Contract, providers, utils} from "ethers";
import {useEffect, useRef, useState} from "react";
import {cryptoDevsABI as abi, NFT_CONTRACT_ADDRESS} from "@/constants";
import Web3Modal from "web3modal";
import Head from "next/head";
import {Footer, Navbar} from "@/components";
import {Alert, Button, Spinner} from "flowbite-react";
import Image from "next/image";

export default function Presale() {
    // walletConnected keep track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false)
    // presaleStarted keeps track of whether the presale has started or not
    const [presaleStarted, setPresaleStarted] = useState(false)
    // presaleEnded keeps track of whether the presale ended
    const [presaleEnded, setPresaleEnded] = useState(false)
    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(true)
    // checks if the currently connected MetaMask wallet is the owner of the contract
    const [isOwner, setIsOwner] = useState(false)
    // tokenIdsMinted keeps track of the number of tokenIds that have been minted
    const [tokenIdsMinted, setTokenIdsMinted] = useState("0")
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef()

    const [paused, setPaused] = useState(false)

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
     * presaleMint: Mint an NFT during the presale
     */
    const presaleMint = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            const signer = await getProviderOrSigner(true)
            // Create a new instance of the Contract with a Signer, which allows
            // update methods
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
            // call the presaleMint from the contract, only whitelisted addresses would be able to mint
            const tx = await nftContract.presaleMint({
                // value signifies the cost of one crypto dev which is "0.01" eth.
                // We are parsing `0.01` string to ether using the utils library from ethers.js
                value: utils.parseEther("0.01")
            })
            setLoading(true)
            await tx.wait()
            setLoading(false)
            window.alert("You successfully minted a Crypto Dev!")
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * publicMint: Mint an NFT after the presale
     */
    const publicMint = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            const signer = await getProviderOrSigner(true)
            // Create a new instance of the Contract with a Signer, which allows
            // update methods
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
            // call the mint from the contract to mint the Crypto Dev
            const tx = await nftContract.mint({
                // value signifies the cost of one crypto dev which is "0.01" eth.
                // We are parsing `0.01` string to ether using the utils library from ethers.js
                value: utils.parseEther("0.01")
            })
            setLoading(true)
            // wait for the transaction to get mined
            await tx.wait()
            setLoading(false)
            window.alert("You successfully minted a Crypto Dev!")
        } catch (err) {
            console.error(err)
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
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * startPresale: starts the presale for the NFT Collection
     */
    const startPresale = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            const signer = await getProviderOrSigner(true)
            // Create a new instance of the Contract with a Signer, which allows
            // update methods
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
            // call the startPresale from the contract
            const tx = await nftContract.startPresale()
            setLoading(true)
            // wait for the transaction to get mined
            await tx.wait()
            setLoading(false)
            // set the presale started to true
            await checkIfPresaleStarted()
        } catch (err) {
            console.error(err)
        }
    }

    const checkIfIsPaused = async () => {
        try {
            const provider = await getProviderOrSigner()
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
            const _paused = await nftContract._paused()
            setPaused(_paused)
        } catch (err) {
            console.error(err)
        }
    }

    const pause = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
            const tx = await nftContract.setPaused(true)
            setLoading(true)
            await tx.wait()
            setLoading(false)
            setPaused(true)
        } catch (err) {
            console.error(err)
        }
    }

    const resume = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
            const tx = await nftContract.setPaused(false)
            setLoading(true)
            await tx.wait()
            setLoading(false)
            setPaused(false)
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * checkIfPresaleStarted: checks if the presale has started by querying the `presaleStarted`
     * variable in the contract
     */
    const checkIfPresaleStarted = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner()
            // We connect to the Contract using a Provider, so we will only
            // have read-only access to the Contract
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
            // call the presaleStarted from the contract
            const _presaleStarted = await nftContract.presaleStarted();
            await getOwner()
            setPresaleStarted(_presaleStarted)
            return _presaleStarted
        } catch (err) {
            console.error(err)
            return false
        }
    }

    /**
     * checkIfPresaleEnded: checks if the presale has ended by querying the `presaleEnded`
     * variable in the contract
     */
    const checkIfPresaleEnded = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner()
            // We connect to the Contract using a Provider, so we will only
            // have read-only access to the Contract
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
            // call the presaleEnded from the contract
            const _presaleEnded = await nftContract.presaleEnded()
            // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
            // Date.now()/1000 returns the current time in seconds
            // We compare if the _presaleEnded timestamp is less than the current time
            // which means presale has ended
            const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000))
            if (hasEnded) setPresaleEnded(true)
            else setPresaleEnded(false)
            return hasEnded
        } catch (err) {
            console.error(err)
            return false
        }
    }

    /**
     * getOwner: calls the contract to retrieve the owner
     */
    const getOwner = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner()
            // We connect to the Contract using a Provider, so we will only
            // have read-only access to the Contract
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
            // call the owner function from the contract
            const _owner = await nftContract.owner()
            // We will get the signer now to extract the address of the currently connected MetaMask account
            const signer = await getProviderOrSigner(true)
            // Get the address associated to the signer which is connected to MetaMask
            const address = await signer.getAddress()
            if (address.toLowerCase() === _owner.toLowerCase())
                setIsOwner(true)
        } catch (err) {
            console.error(err.message)
        }
    }

    /**
     * getTokenIdsMinted: gets the number of tokenIds that have been minted
     */
    const getTokenIdsMinted = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner()
            // We connect to the Contract using a Provider, so we will only
            // have read-only access to the Contract
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
            // call the tokenIds from the contract
            const _tokenIds = await nftContract.tokenIds()
            //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
            setTokenIdsMinted(_tokenIds.toString())
        } catch (err) {
            console.error(err)
        }
    }

    /*
   renderButton: Returns a button based on the state of the dapp
   */
    const renderButton = () => {
        // If wallet is not connected, return a button which allows them to connect their wallet
        if (!walletConnected)
            return <Button color={"gray"} onClick={connectWallet}>
                <Image width={256} height={256} src="/metamask.svg" className={"w-6 h-5 mr-2 -ml-1"}
                       alt="Metamask logo"/>
                Connect with MetaMask
            </Button>

        // If connected user is the owner, and presale hasn't started yet, allow them to start the presale
        if (isOwner && !presaleStarted)
            return <Button size={"xl"} gradientMonochrome="info" onClick={startPresale}
                           disabled={loading}>
                {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                Start presale!
            </Button>

        // If connected user is not the owner but presale hasn't started yet, tell them that
        if (!presaleStarted)
            return <div className="text-amber-600 font-bold text-xl">
                <p>Presale hasn&#39;t started!</p>
            </div>

        // If presale started, but hasn't ended yet, allow for minting during the presale period
        if (presaleStarted && !presaleEnded)
            return <div className={"text-emerald-400 font-bold text-xl flex flex-col items-center space-y-6"}>
                <p>Presale has started!!! If your address is whitelisted, Mint a Crypto Dev 🥳</p>
                <div className={"flex items-center space-x-6"}>
                    <Button size={"xl"} gradientMonochrome="info" onClick={presaleMint}
                            disabled={loading}>
                        {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                        Presale Mint 🚀
                    </Button>
                    {isOwner && <Button size={"xl"} gradientMonochrome="failure" onClick={paused ? resume : pause} disabled={loading}>
                        {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                        {paused ? "Resume" : "Pause"}
                    </Button>}
                </div>
            </div>

        // If presale started and has ended, it's time for public minting
        if (presaleStarted && presaleEnded)
            return <div className={"flex items-center space-x-6"}>
                <Button size={"xl"} gradientMonochrome="info" onClick={publicMint}
                        disabled={loading}>
                    {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                    Public Mint 🚀
                </Button>
                {isOwner && <Button size={"xl"} gradientMonochrome="failure" onClick={paused ? resume : pause} disabled={loading}>
                    {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                    {paused ? "Resume" : "Pause"}
                </Button>}
            </div>
    }

    const setup = async () => {
        await checkIfIsPaused()

        // Check if presale has started and ended
        const _presaleStarted = await checkIfPresaleStarted()
        if (_presaleStarted) await checkIfPresaleEnded()

        await getTokenIdsMinted()

        // Set an interval which gets called every 5 seconds to check presale has ended
        const presaleEndedInterval = setInterval(async () => {
            const _presaleStarted = await checkIfPresaleStarted()
            if (_presaleStarted) {
                const _presaleEnded = await checkIfPresaleEnded()
                if (_presaleEnded) {
                    clearInterval(presaleEndedInterval)
                }
            }
        }, 5 * 1000)

        // set an interval to get the number of token Ids minted every 5 seconds
        setInterval(async () => {
            await getTokenIdsMinted()
        }, 5 * 1000)
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
            connectWallet();

            setup().finally(() => setLoading(false))
        }
    }, [walletConnected])

    if (!loading)
        return (
            <>
                <Head>
                    <title>Crypto Devs | Presale</title>
                    <meta name="description" content="Whitelist-Dapp"/>
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

                    <Alert color="info" className={"px-16"}>
                        <span className={"font-bold"}>
                            {tokenIdsMinted}/20 have been minted
                        </span>
                    </Alert>

                    {renderButton()}
                </main>
                <Footer/>
            </>
        )

    return <div className={"h-screen w-screen flex justify-center items-center dark:bg-gray-900"}>
        <Spinner size={"xl"} aria-label="Loading spinner" className={"dark:text-white"}/>
    </div>
}