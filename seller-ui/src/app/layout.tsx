import type { Metadata } from 'next'
import { Providers } from './providers'

import './global.css'

export const metadata: Metadata = {
  title: 'E-Commerce Seller',
  description: 'E-Commerce Seller',
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
        {children}
        </Providers>
        </body>
    </html>
  )
}
