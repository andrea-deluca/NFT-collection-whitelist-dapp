/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [require('flowbite/plugin')],
}