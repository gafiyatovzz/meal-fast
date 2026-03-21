import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meal Fix',
  description: 'Трекер питания с AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
