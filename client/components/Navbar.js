import {Button, DarkThemeToggle, Navbar} from "flowbite-react";
import {FaGithub} from 'react-icons/fa'
import Link from "next/link";

const navigation = [
    {label: "Home", href: "/"},
    {label: "Presale", href: "/presale"},
    {label: "ICO", href: "/ico"},
]

const NavigationBar = () => <Navbar
    fluid={true}
    className="fixed top-0 w-screen dark:bg-gray-900 px-4"
>
    <div className="flex justify-between w-full items-center">
        <div className="flex space-x-6">
            {navigation.map((item, idx) => (
                <Link key={idx} className="dark:text-white text-slate-800 hover:underline font-semibold tracking-wider"
                      href={item.href}>
                    {item.label}
                </Link>
            ))}
        </div>
        <div className="flex space-x-6">
            <DarkThemeToggle/>
            <Button color="gray" href="http://github.com/andrea-deluca" target={"_blank"}>
                <FaGithub className="mr-3"/>
                See on Github
            </Button>
        </div>
    </div>
</Navbar>

export default NavigationBar