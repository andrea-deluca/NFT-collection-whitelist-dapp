import '@/styles/globals.css'
import {Flowbite, useThemeMode, useTheme} from "flowbite-react";

export default function App({Component, pageProps}) {
    const {theme: base} = useTheme()
    const [mode] = useThemeMode()

    const theme = {
        ...base,
        button: {
            ...base.button,
            color: {
                ...base.button.color,
                gray: "text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
            }
        }
    }

    return <Flowbite theme={{theme, dark: mode === "dark"}}>
        <Component {...pageProps} />
    </Flowbite>
}
