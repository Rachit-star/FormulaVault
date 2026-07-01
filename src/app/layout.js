import { Plus_Jakarta_Sans, Fira_Code } from 'next/font/google'
import 'katex/dist/katex.min.css'
import '@/styles/globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata = {
  title: 'FormulaForge',
  description: 'Your personal formula vault for quant prep',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${firaCode.variable}`}>
      <body>{children}</body>
    </html>
  )
}

