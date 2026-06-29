import React from "react"
import "./global.css"
import Header from "./shared/widgets/header/Header"




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

        <Header></Header>
        {children}
        </body>
    </html>
  )
}
