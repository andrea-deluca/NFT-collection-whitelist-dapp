import {useEffect, useRef, useState} from "react";
import Head from "next/head";
import Image from "next/image"
import {Contract, providers} from "ethers";
import {formatEther} from "ethers/lib/utils";
import Web3Modal from "web3modal";
import {Alert, Button, Label, Spinner, TextInput} from "flowbite-react";
import {
    CRYPTO_DEVS_DAO_CONTRACT_ADDRESS,
    cryptoDevsABI as NFT_ABI,
    cryptoDevsDaoABI as DAO_ABI,
    NFT_CONTRACT_ADDRESS
} from "@/constants";
import {Footer, Navbar} from "@/components";

const DAO = () => {
    const [treasuryBalance, setTreasuryBalance] = useState("0")
    const [numProposals, setNumProposals] = useState("0");
    const [proposals, setProposals] = useState([])
    const [nftBalance, setNftBalance] = useState(0)
    const [fakeNftTokenId, setFakeNftTokenId] = useState("")
    const [selectedTab, setSelectedTab] = useState("")
    const [loading, setLoading] = useState(false)
    const [walletConnected, setWalletConnected] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
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

    // Helper function to return a DAO Contract instance
    // given a Provider/Signer
    const getDAOContractInstance = (providerOrSigner) => {
        return new Contract(CRYPTO_DEVS_DAO_CONTRACT_ADDRESS, DAO_ABI, providerOrSigner)
    }

    // Helper function to return a CryptoDevs NFT Contract instance
    // given a Provider/Signer
    const getCryptoDevsNFTContractInstance = (providerOrSigner) => {
        return new Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, providerOrSigner)
    }

    /**
     * getOwner: gets the contract owner by connected address
     */
    const getDAOOwner = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = getDAOContractInstance(signer)

            // call the owner function from the contract
            const _owner = await contract.owner();
            // Get the address associated to signer which is connected to Metamask
            const address = await signer.getAddress();
            if (address.toLowerCase() === _owner.toLowerCase())
                setIsOwner(true)

        } catch (err) {
            console.error(err.message)
        }
    }

    /**
     * withdrawCoins: withdraws ether by calling
     * the withdraw function in the contract
     */
    const withdrawDAOEther = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = getDAOContractInstance(signer)

            const tx = await contract.withdrawEther()
            setLoading(true)
            await tx.wait()
            setLoading(false)
            getDAOTreasuryBalance()
        } catch (err) {
            console.error(err)
            window.alert(err.reason)
        }
    }

    // Reads the ETH balance of the DAO contract and sets the `treasuryBalance` state variable
    const getDAOTreasuryBalance = async () => {
        try {
            const provider = await getProviderOrSigner()
            const balance = await provider.getBalance(CRYPTO_DEVS_DAO_CONTRACT_ADDRESS)
            setTreasuryBalance(balance.toString())
        } catch (err) {
            console.error(err)
        }
    }

    // Reads the number of proposals in the DAO contract and sets the `numProposals` state variable
    const getNumProposalsInDAO = async () => {
        try {
            const provider = await getProviderOrSigner()
            const contract = getDAOContractInstance(provider)
            const daoNumProposals = await contract.numProposals()
            setNumProposals(daoNumProposals.toString())
        } catch (err) {
            console.error(err)
        }
    }

    // Reads the balance of the user's CryptoDevs NFTs and sets the `nftBalance` state variable
    const getUserNFTBalance = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = getCryptoDevsNFTContractInstance(signer)
            const balance = await contract.balanceOf(signer.getAddress())
            setNftBalance(parseInt(balance.toString()))
        } catch (err) {
            console.error(err)
        }
    }

    // Calls the `createProposal` function in the contract, using the tokenId from `fakeNftTokenId`
    const createProposal = async () => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = getDAOContractInstance(signer)
            const tx = await contract.createProposal(fakeNftTokenId)
            setLoading(true)
            await tx.wait()
            await getNumProposalsInDAO();
            setLoading(false)
        } catch (err) {
            console.error(err)
            window.alert(err.reason)
        }
    }

    // Helper function to fetch and parse one proposal from the DAO contract
    // Given the Proposal ID
    // and converts the returned data into a Javascript object with values we can use
    const fetchProposalById = async (id) => {
        try {
            const provider = await getProviderOrSigner()
            const contract = getDAOContractInstance(provider)
            const proposal = await contract.proposals(id)

            const parsedProposal = {
                proposalId: id,
                nftTokenId: proposal.nftTokenId.toString(),
                deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
                yayVotes: proposal.yayVotes.toString(),
                nayVotes: proposal.nayVotes.toString(),
                executed: proposal.executed
            }

            return parsedProposal
        } catch (err) {
            console.error(err)
        }
    }

    // Runs a loop `numProposals` times to fetch all proposals in the DAO
    // and sets the `proposals` state variable
    const fetchAllProposals = async () => {
        try {
            const proposals = []
            for (let i = 0; i < numProposals; i++) {
                const proposal = await fetchProposalById(i)
                proposals.push(proposal)
            }
            setProposals(proposals)
            return proposals
        } catch (err) {
            console.error(err)
        }
    }

    // Calls the `voteOnProposal` function in the contract, using the passed
    // proposal ID and Vote
    const voteOnProposal = async (proposalId, _vote) => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = getDAOContractInstance(signer)

            const vote = _vote === "YAY" ? 0 : 1

            const tx = await contract.voteOnProposal(proposalId, vote)
            setLoading(true)
            await tx.wait()
            setLoading(false)
            await fetchAllProposals()
        } catch (err) {
            console.error(err)
            window.alert(err.reason)
        }
    }

    // Calls the `executeProposal` function in the contract, using
    // the passed proposal ID
    const executeProposal = async (proposalId) => {
        try {
            const signer = await getProviderOrSigner(true)
            const contract = getDAOContractInstance(signer)

            const tx = await contract.executeProposal(proposalId)
            setLoading(true)
            await tx.wait()
            setLoading(false)
            await fetchAllProposals()
            getDAOTreasuryBalance()
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

    // piece of code that runs everytime the value of `walletConnected` changes
    // so when a wallet connects or disconnects
    // Prompts user to connect wallet if not connected
    // and then calls helper functions to fetch the
    // DAO Treasury Balance, User NFT Balance, and Number of Proposals in the DAO
    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "sepolia",
                providerOptions: {},
                disableInjectedProvider: false
            })

            connectWallet().then(() => {
                Promise.all([
                    getDAOTreasuryBalance(),
                    getUserNFTBalance(),
                    getNumProposalsInDAO(),
                    getDAOOwner(),
                ]).finally(() => setLoadPage(false))
            })
        }
    }, [walletConnected])

    // Piece of code that runs everytime the value of `selectedTab` changes
    // Used to re-fetch all proposals in the DAO when user switches
    // to the 'View Proposals' tab
    useEffect(() => {
        if (selectedTab === "View Proposals")
            fetchAllProposals()
    }, [selectedTab])

    // Render the contents of the appropriate tab based on `selectedTab`
    const renderTabs = () => {
        switch (selectedTab) {
            case "Create Proposal":
                return renderCreateProposalTab();
            case "View Proposals":
                return renderViewProposalsTab();
            default:
                return null
        }
    }

    // Renders the 'Create Proposal' tab content
    const renderCreateProposalTab = () => {
        if (nftBalance === 0)
            return <div className="text-rose-600 text-center font-bold text-xl">
                <p>You do not own any CryptoDevs NFTs.<br/>
                    You cannot create or vote on proposals
                </p>
            </div>
        else
            return <div className={"flex flex-col space-y-6"}>
                <div className={"flex flex-col space-y-2"}>
                    <Label for={"fake-nft-token-id"}>Fake NFT Token ID to Purchase</Label>
                    <TextInput
                        id={"fake-nft-token-id"}
                        type="number"
                        placeholder={"0"}
                        onChange={(e) => setFakeNftTokenId(e.target.value)}
                    />
                </div>
                <Button size={"xl"} gradientMonochrome="info" onClick={createProposal}
                        disabled={loading}>
                    {loading && <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                    Create
                </Button>
            </div>
    }

    // Renders the 'View Proposals' tab content
    const renderViewProposalsTab = () => {
        if (proposals.length === 0)
            return <div className="text-amber-600 text-center font-bold text-xl">
                <p>No proposals have been created</p>
            </div>
        else return <div
            className={"flex w-full space-x-8 px-4"}>
            {proposals.map((proposal, idx) =>
                <div key={idx}
                     className={"min-w-[20rem] snap-start bg-slate-100 p-4 rounded-lg"}>
                    <div className={"text-center mb-3"}>
                        <h3 className={"font-bold text-xl mb-2"}>Proposal ID: {proposal.proposalId}</h3>
                        <p>Fake NFT to Purchase: {proposal.nftTokenId}</p>
                        <p>Deadline: {proposal.deadline.toLocaleString()}</p>
                        <p>Yay Votes: {proposal.yayVotes}</p>
                        <p>Nay Votes: {proposal.nayVotes}</p>
                        <p>Executed?: {proposal.executed.toString()}</p>
                    </div>
                    {proposal.deadline.getTime() > Date.now() && !proposal.executed ? (
                        <div className={"flex space-x-4 items-center"}>
                            <Button size={"xl"} gradientMonochrome="success"
                                    onClick={() => voteOnProposal(proposal.proposalId, "YAY")}
                                    disabled={loading}>
                                {loading &&
                                    <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                                Vote YAY
                            </Button>
                            <Button size={"xl"} gradientMonochrome="failure"
                                    onClick={() => voteOnProposal(proposal.proposalId, "NAY")}
                                    disabled={loading}>
                                {loading &&
                                    <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                                Vote NAY
                            </Button>
                        </div>
                    ) : proposal.deadline.getTime() < Date.now() && !proposal.executed ? (
                        <div className={"flex items-center justify-center"}>
                            <Button size={"xl"} gradientMonochrome="info"
                                    onClick={() => executeProposal(proposal.proposalId)}
                                    disabled={loading}>
                                {loading &&
                                    <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>}
                                Execute Proposal{" "}
                                {proposal.yayVotes > proposal.nayVotes ? "(YAY)" : "(NAY)"}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-amber-600 text-center font-bold text-xl">
                            <p>Proposal Executed</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    }

    if (!loadPage)
        return <>
            <Head>
                <title>Crypto Devs | DAO</title>
                <meta name="description" content="CryptoDevs DAO"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Navbar/>
            <main className="h-screen overflow-hidden flex flex-col justify-center items-center dark:bg-gray-900 space-y-12">
                <div className={"text-center"}>
                    <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                        Welcome to <mark className="px-2 text-white bg-blue-600 rounded dark:bg-blue-500">Crypto
                        Devs DAO</mark>
                    </h1>
                    {walletConnected && <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
                        Treasury Balance: {formatEther(treasuryBalance)}
                    </p>}
                </div>

                {walletConnected ?
                    <>
                        <div
                            className={"flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-4"}>
                            <Alert color="info" className={"px-16"}>
                                <span className={"font-bold"}>
                                    Your CryptoDevs NFT Balance: {nftBalance}
                                </span>
                            </Alert>
                            <Alert color="info" className={"px-16"}>
                                <span className={"font-bold"}>
                                    Total number of Proposals: {numProposals}
                                </span>
                            </Alert>
                        </div>
                        <div className={"flex flex-col space-y-6 items-center"}>
                            <div className={"flex space-x-4 items-center"}>
                                <Button size={"xl"} color="light"
                                        onClick={() => setSelectedTab("Create Proposal")}>
                                    Create Proposal
                                </Button>
                                <Button size={"xl"} color="light"
                                        onClick={() => setSelectedTab("View Proposals")}>
                                    View Proposals
                                </Button>
                            </div>
                            <div className={"max-w-sm lg:max-w-4xl xl:max-w-7xl overflow-x-scroll snap-x snap-mandatory"}>
                                {renderTabs()}
                            </div>
                            {/* Display additional withdraw button if connected wallet is owner */}
                            {isOwner && (
                                <Button size={"xl"} gradientMonochrome="info"
                                        onClick={withdrawDAOEther}
                                        disabled={loading}>
                                    {loading &&
                                        <Spinner aria-label="Loading spinner" className={"mr-3 dark:text-white"}/>
                                    }
                                    Withdraw DAO ETH
                                </Button>
                            )}
                        </div>
                    </> :
                    <Button color={"gray"} onClick={connectWallet}>
                        <Image width={256} height={256} src="/metamask.svg" className={"w-6 h-5 mr-2 -ml-1"}
                               alt="Metamask logo"/>
                        Connect with MetaMask
                    </Button>
                }
            </main>
            <Footer/>
        </>

    return <div className={"h-screen w-screen flex justify-center items-center dark:bg-gray-900"}>
        <Spinner size={"xl"} aria-label="Loading spinner" className={"dark:text-white"}/>
    </div>
}

export default DAO;