import "./global.css";


export const metadata = {
    title: 'F1 GPT',
    description: 'A goto guide for all your f1 related questions',
}

export default function RootLayout({children}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}