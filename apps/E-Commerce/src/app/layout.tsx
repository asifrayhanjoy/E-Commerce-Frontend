import React from "react"
import "./global.css"
import Header from "./shared/widgets/header/Header"
import Providers from "./providers"
import Footer from "./shared/widgets/footer/Footer"




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
      <body suppressHydrationWarning>

        <Providers>
          <Header></Header>
          {children}
          <Footer />
        </Providers>
        </body>
    </html>
  )
}
