import type {Metadata} from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Phish-Slayer | Cybersecurity SPA',
  description: 'Neutralize threats instantly. Eliminate dwell time forever.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-black text-white font-inter antialiased selection:bg-[#2DD4BF]/30 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
