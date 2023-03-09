import {Footer as FlowbiteFooter} from "flowbite-react";
import {FaGithub, FaLinkedinIn} from 'react-icons/fa'

const socials = [
    {desc: "Github page", href: "https://www.github.com/andrea-deluca", icon: FaGithub({size: 24})},
    {desc: "LinkedIn profile", href: "https://www.linkedin.com/in/andrea-deluca-022b1820b/", icon: FaLinkedinIn({size: 24})},
]

const Footer = () =>
    <FlowbiteFooter container={true} className="fixed bottom-0 w-screen dark:bg-gray-900">
        <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            This is a demo project developed by Andrea Deluca
        </span>
        <div className="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
            {socials.map((social, idx) => (
                <a key={idx} href={social.href} className="text-gray-500 hover:text-gray-900 dark:hover:text-white" target={"_blank"}>
                    {social.icon}
                    <span className="sr-only">{social.desc}</span>
                </a>))}
        </div>
    </FlowbiteFooter>

export default Footer