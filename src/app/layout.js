import './globals.css'

export const metadata = {
  title: 'Ем и расту',
  description: 'Трекер питания с AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
