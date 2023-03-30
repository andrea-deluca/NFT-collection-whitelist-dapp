import {useEffect, useRef, useState} from "react";
import {BigNumber, providers} from "ethers";
import {getCDTokensBalance, getEtherBalance, getLPTokensBalance, getReserveOfCDTokens} from "@/utils/getAmounts";
import {formatEther, parseEther} from "ethers/lib/utils";
import {getAmountOfTokenReceivedFromSwap, swapTokens} from "@/utils/swap";
import {addLiquidity, calculateCD} from "@/utils/addLiquidity";
import {getTokensAfterRemove, removeLiquidity} from "@/utils/removeLiquidity";
import Web3Modal from "web3modal";
import {Alert, Button, Label, Select, Spinner, TextInput} from "flowbite-react";
import Image from "next/image";
import Head from "next/head";
import {Footer, Navbar} from "@/components";

const Exchange = () => {
    /** General state variables */
        // loading is set to true when the transaction is mining and set to false when
        // the transaction has mined
    const [loading, setLoading] = useState(false)
    const [loadPage, setLoadPage] = useState(true)
    // We have two tabs in this dapp, Liquidity Tab and Swap Tab. This variable
    // keeps track of which Tab the user is on. If it is set to true this means
    // that the user is on `liquidity` tab else he is on `swap` tab
    const [liquidityTab, setLiquidityTab] = useState(true)
    // This variable is the `0` number in form of a BigNumber
    const zero = BigNumber.from(0)
    /** Variables to keep track of amount */
        // `ethBalance` keeps track of the amount of Eth held by the user's account
    const [ethBalance, setEtherBalance] = useState(zero)
    // `reservedCD` keeps track of the Crypto Dev tokens Reserve balance in the Exchange contract
    const [reservedCD, setReservedCD] = useState(zero)
    // Keeps track of the ether balance in the contract
    const [etherBalanceContract, setEtherBalanceContract] = useState(zero)
    // cdBalance is the amount of `CD` tokens help by the users account
    const [cdBalance, setCDBalance] = useState(zero)
    // `lpBalance` is the amount of LP tokens held by the users account
    const [lpBalance, setLPBalance] = useState(zero)
    /** Variables to keep track of liquidity to be added or removed */
        // addEther is the amount of Ether that the user wants to add to the liquidity
    const [addEther, setAddEther] = useState(zero)
    // addCDTokens keeps track of the amount of CD tokens that the user wants to add to the liquidity
    // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
    // CD tokens that the user can add given a certain amount of ether
    const [addCDTokens, setAddCDTokens] = useState(zero)
    // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
    const [removeEther, setRemoveEther] = useState(zero)
    // removeCD is the amount of `Crypto Dev` tokens that would be sent back to the user based on a certain number of `LP` tokens
    // that he wants to withdraw
    const [removeCD, setRemoveCD] = useState(zero)
    // amount of LP tokens that the user wants to remove from liquidity
    const [removeLPTokens, setRemoveLPTokens] = useState("0")
    /** Variables to keep track of swap functionality */
        // Amount that the user wants to swap
    const [swapAmount, setSwapAmount] = useState("")
    // This keeps track of the number of tokens that the user would receive after a swap completes
    const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] = useState(zero)
    // Keeps track of whether  `Eth` or `Crypto Dev` token is selected. If `Eth` is selected it means that the user
    // wants to swap some `Eth` for some `Crypto Dev` tokens and vice versa if `Eth` is not selected
    const [ethSelected, setEthSelected] = useState(true)
    /** Wallet connection */
        // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef()
    // walletConnected keep track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false)

    /**
     * getAmounts call various functions to retrieve amounts for eth balance,
     * LP tokens etc
     */
    const getAmounts = async () => {
        try {
            const provider = await getProviderOrSigner(false)
            const signer = await getProviderOrSigner(true)
            const address = await signer.getAddress()
            // get the amount of eth in the user's account
            const _ethBalance = await getEtherBalance(provider, address)
            // get the amount of `Crypto Dev` tokens held by the user
            const _cdBalance = await getCDTokensBalance(provider, address)
            // get the amount of `Crypto Dev` LP tokens held by the user
            const _lpBalance = await getLPTokensBalance(provider, address)
            // gets the amount of `CD` tokens that are present in the reserve of the `Exchange contract`
            const _reservedCD = await getReserveOfCDTokens(provider)
            // Get the ether reserves in the contract
            const _ethBalanceContract = await getEtherBalance(provider, null, true)
            setEtherBalance(_ethBalance)
            setCDBalance(_cdBalance)
            setLPBalance(_lpBalance)
            setReservedCD(_reservedCD)
            setEtherBalanceContract(_ethBalanceContract)
        } catch (err) {
            console.error(err)
        }
    }

    /**** SWAP FUNCTIONS ****/

    /**
     * swapTokens: Swaps  `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth/Crypto Dev tokens.
     */
    const _swapTokens = async () => {
        try {
            // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
            const swapAmountWei = parseEther(swapAmount)
            // Check if the user entered zero
            // We are here using the `eq` method from BigNumber class in `ethers.js`
            if (!swapAmountWei.eq(zero)) {
                const signer = await getProviderOrSigner(true)
                setLoading(true)
                // Call the swapTokens function from the `utils` folder
                await swapTokens(signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected)
                setLoading(false)
                await getAmounts()
            }
        } catch (err) {
            console.error(err)
            setLoading(false)
        } finally {
            setSwapAmount("")
        }
    }

    /**
     * _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be received
     * when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
     */
    const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
        try {
            // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
            const _swapAmountWei = parseEther(_swapAmount.toString())
            // Check if the user entered zero
            // We are here using the `eq` method from BigNumber class in `ethers.js`
            if (!_swapAmountWei.eq(zero)) {
                const provider = await getProviderOrSigner()
                // Get the amount of ether in the contract
                const _ethBalance = await getEtherBalance(provider, null, true)
                // Call the `getAmountOfTokensReceivedFromSwap` from the utils folder
                const amountOfTokens = await getAmountOfTokenReceivedFromSwap(_swapAmountWei, provider, ethSelected, _ethBalance, reservedCD)
                setTokenToBeReceivedAfterSwap(amountOfTokens)
            } else setTokenToBeReceivedAfterSwap(zero)
        } catch (err) {
            console.error(err)
        }
    }

    /**** END ****/

    /**** ADD LIQUIDITY FUNCTIONS ****/

    /**
     * _addLiquidity helps add liquidity to the exchange,
     * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
     * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
     * then we calculate the crypto dev tokens he can add, given the Eth he wants to add by keeping the ratios
     * constant
     */
    const _addLiquidity = async () => {
        try {
            // Convert the ether amount entered by the user to Bignumber
            const addEtherWei = parseEther(addEther.toString())
            // Check if the values are zero
            if (!addEtherWei.eq(zero) && !addCDTokens.eq(zero)) {
                const signer = await getProviderOrSigner(true)
                setLoading(true)
                // call the addLiquidity function from the utils folder
                await addLiquidity(signer, addCDTokens, addEtherWei)
                setLoading(false)
                await getAmounts()
            }
        } catch (err) {
            console.error(err)
            setLoading(false)
        } finally {
            // Reinitialize the CD tokens
            setAddCDTokens(zero)
        }
    }

    /**** END ****/

    /**** REMOVE LIQUIDITY FUNCTIONS ****/

    /**
     * _removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
     * liquidity and also the calculated amount of `ether` and `CD` tokens
     */
    const _removeLiquidity = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            // Convert the LP tokens entered by the user to a BigNumber
            const removeLPTokensWei = parseEther(removeLPTokens)
            setLoading(true)
            await removeLiquidity(signer, removeLPTokensWei)
            setLoading(false)
            await getAmounts()
        } catch (err) {
            console.error(err)
            setLoading(false)
        } finally {
            setRemoveCD(zero)
            setRemoveEther(zero)
        }
    }

    /**
     * _getTokensAfterRemove: Calculates the amount of `Ether` and `CD` tokens
     * that would be returned back to user after he removes `removeLPTokenWei` amount
     * of LP tokens from the contract
     */
    const _getTokensAfterRemove = async (_removeLPTokens) => {
        try {
            const provider = await getProviderOrSigner()
            // Convert the LP tokens entered by the user to a BigNumber
            const removeLPTokenWei = parseEther(_removeLPTokens)
            // Get the Eth reserves within the exchange contract
            const _ethBalance = await getEtherBalance(provider, null, true)
            // get the crypto dev token reserves from the contract
            const cryptoDevTokenReserve = await getReserveOfCDTokens(provider)
            // call the getTokensAfterRemove from the utils folder
            const {
                _removeEther,
                _removeCD
            } = await getTokensAfterRemove(provider, removeLPTokenWei, _ethBalance, cryptoDevTokenReserve)
            setRemoveEther(_removeEther)
            setRemoveCD(_removeCD)
        } catch (err) {
            console.error(err)
        }
    }

    /**** END ****/

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
    };

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
    // useEffects are used to react to changes in state of the website
    // The array at the end of function call represents what state changes will trigger this effect
    // In this case, whenever the value of `walletConnected` changes - this effect will be called
    useEffect(() => {
        // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "sepolia",
                providerOptions: {},
                disableInjectedProvider: false
            })
            Promise.all([
                connectWallet(),
                getAmounts(),
            ]).finally(() => setLoadPage(false))
        }
    }, [walletConnected])

    /*
        renderButton: Returns a button based on the state of the dapp
    */
    const renderButton = () => {
        // If wallet is not connected, return a button which allows them to connect their wllet
        if (!walletConnected)
            return <Button color={"gray"} onClick={connectWallet}>
                <Image width={256} height={256} src="/metamask.svg" className={"w-6 h-5 mr-2 -ml-1"}
                       alt="Metamask logo"/>
                Connect with MetaMask
            </Button>

        if (liquidityTab) return (
            <div className={"flex flex-col space-y-6 items-center"}>
                <Alert color="info" className={"px-16"}>
                    <div>
                        You have: <br/>
                        {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                        {formatEther(cdBalance)} CryptoDev Tokens <br/>
                        {formatEther(ethBalance)} Ether <br/>
                        {formatEther(lpBalance)} CryptoDev LP Tokens
                    </div>
                </Alert>
                {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
                how much initial liquidity he wants to add else just render the state where liquidity is not zero, and
                we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
                {parseEther(reservedCD.toString()).eq(zero) ? (
                    <div className={"flex flex-col space-y-4"}>
                        <div className={"flex flex-col space-y-2"}>
                            <Label htmlFor={"eth-amount"}>Ether</Label>
                            <TextInput
                                id={"eth-amount"}
                                type="number"
                                placeholder={"Amount of Ether"}
                                onChange={(e) => setAddEther(e.target.value || "0")}
                            />
                        </div>
                        <div className={"flex flex-col space-y-2"}>
                            <Label htmlFor={"cdt-amount"}>CryptoDev Tokens</Label>
                            <TextInput
                                id={"cdt-amount"}
                                type="number"
                                placeholder={"Amount of CryptoDev Tokens"}
                                onChange={(e) => setAddCDTokens(BigNumber.from(parseEther(e.target.value || "0")))}
                            />
                        </div>
                        <Button size={"xl"} gradientMonochrome="info" onClick={_addLiquidity}
                                disabled={loading}>
                            {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                            Add
                        </Button>
                    </div>
                ) : (
                    <div className={"flex flex-col space-y-4"}>
                        <div className={"flex flex-col space-y-2"}>
                            <Label htmlFor={"eth-amount"}>Ether</Label>
                            <TextInput
                                id={"eth-amount"}
                                type="number"
                                placeholder={"Amount of Ether"}
                                onChange={async (e) => {
                                    setAddEther(e.target.value || "0")
                                    // calculate the number of CD tokens that
                                    // can be added given  `e.target.value` amount of Eth
                                    const _addCDTokens = await calculateCD(
                                        e.target.value || "0",
                                        etherBalanceContract,
                                        reservedCD
                                    )
                                    setAddCDTokens(_addCDTokens)
                                }}
                            />
                            <span className={"text-sm text-slate-600"}>
                                {`You will need ${formatEther(addCDTokens)} CryptoDev Tokens`}
                            </span>
                        </div>
                        <Button size={"xl"} gradientMonochrome="info" onClick={_addLiquidity}
                                disabled={loading}>
                            {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                            Add
                        </Button>
                    </div>
                )}
                <div className={"flex flex-col space-y-4"}>
                    <div className={"flex flex-col space-y-2"}>
                        <Label htmlFor={"lp-amount"}>CryptoDev LP Tokens</Label>
                        <TextInput
                            id={"lp-amount"}
                            type="number"
                            placeholder={"Amount of LP Tokens"}
                            onChange={async (e) => {
                                setRemoveLPTokens(e.target.value || "0")
                                // Calculate the amount of Ether and CD tokens that the user would receive
                                // After he removes `e.target.value` amount of `LP` tokens
                                await _getTokensAfterRemove(e.target.value || "0")
                            }}
                        />
                        <span className={"text-sm text-slate-600"}>
                            {`You will get ${formatEther(removeCD)} CryptoDev Tokens and ${formatEther(removeEther)} Eth`}
                        </span>
                    </div>
                    <Button size={"xl"} gradientMonochrome="info" onClick={_removeLiquidity}
                            disabled={loading}>
                        {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                        Remove
                    </Button>
                </div>
            </div>
        )
        else return (
            <div className={"flex flex-col space-y-4"}>
                <div className={"flex flex-col space-y-2"}>
                    <Label htmlFor={"amount"}>Amount</Label>
                    <TextInput
                        id={"amount"}
                        type="number"
                        value={swapAmount}
                        placeholder={"Amount"}
                        onChange={async (e) => {
                            setSwapAmount(e.target.value || "")
                            // Calculate the amount of tokens user would receive after the swap
                            await _getAmountOfTokensReceivedFromSwap(e.target.value || "0")
                        }}
                    />
                    <Select
                        id="dropdown"
                        name="dropdown"
                        onChange={async () => {
                            setEthSelected(!ethSelected)
                            // Initialize the values back to zero
                            await _getAmountOfTokensReceivedFromSwap(0)
                            setSwapAmount("")
                        }}
                    >
                        <option value="eth">Ethereum</option>
                        <option value="cryptoDevToken">Crypto Dev Token</option>
                    </Select>
                    <span className={"text-sm text-slate-600"}>
                        {ethSelected ?
                            `You will get ${formatEther(tokenToBeReceivedAfterSwap)} Crypto Dev Tokens` :
                            `You will get ${formatEther(tokenToBeReceivedAfterSwap)} Eth`
                        }
                    </span>
                </div>
                <Button size={"xl"} gradientMonochrome="info" onClick={_swapTokens}
                        disabled={loading}>
                    {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                    Swap
                </Button>
            </div>
        )
    }

    if (!loadPage)
        return <>
            <Head>
                <title>Crypto Devs | Exchange</title>
                <meta name="description" content="CryptoDevs Exchange"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Navbar/>
            <main
                className="h-screen overflow-hidden flex flex-col justify-center items-center dark:bg-gray-900 space-y-12">
                <div className={"text-center"}>
                    <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                        Welcome to <mark className="px-2 text-white bg-blue-600 rounded dark:bg-blue-500">Crypto
                        Devs Exchange</mark>
                    </h1>
                    <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
                        Exchange Ethereum to Crypto Dev Tokens
                    </p>
                </div>

                {walletConnected &&
                    <div className={"flex flex-col space-y-6 items-center"}>
                        <div className={"flex space-x-4 items-center"}>
                            <Button size={"xl"} color="light"
                                    onClick={() => setLiquidityTab(true)}>
                                Liquidity
                            </Button>
                            <Button size={"xl"} color="light"
                                    onClick={() => setLiquidityTab(false)}>
                                Swap
                            </Button>
                        </div>
                        {renderButton()}
                    </div>
                }
            </main>
            <Footer/>
        </>

    return <div className={"h-screen w-screen flex justify-center items-center dark:bg-gray-900"}>
        <Spinner size={"xl"} aria-label="Loading spinner" className={"dark:text-white"}/>
    </div>
}

export default Exchange