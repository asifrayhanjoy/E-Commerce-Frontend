import type { Metadata } from 'next'
import { Providers } from './providers'
import { Poppins } from 'next/font/google'


import './global.css'

export const metadata: Metadata = {
  title: 'E-Commerce Seller',
  description: 'E-Commerce Seller',
}

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-slate-900 font-sans antialiased ${poppins.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
