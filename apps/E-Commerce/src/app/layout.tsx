import React from "react"
import "./global.css"
import Header from "./shared/widgets/header/Header"
import Providers from "./providers"




export const metadata = {
  title: 'E-Commerce',
  description: 'E-Commerce',
}

export default function RootLayout({
  
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>

        <Providers>
          <Header></Header>
          {children}
        </Providers>
        </body>
    </html>
  )
}
