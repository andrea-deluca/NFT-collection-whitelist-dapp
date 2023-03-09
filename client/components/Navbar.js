import {Navbar, Button, DarkThemeToggle} from "flowbite-react";
import {FaGithub} from 'react-icons/fa'

const NavigationBar = () => <Navbar
    fluid={true}
    className="fixed top-0 w-screen dark:bg-gray-900"
>
    <div className="flex ml-auto space-x-6">
        <DarkThemeToggle/>
        <Button color="gray" href="https://github.com/andrea-deluca/NFT-collection-whitelist-dapp" target={"_blank"}>
            <FaGithub className="mr-3"/>
            See on Github
        </Button>
    </div>
</Navbar>

export default NavigationBar