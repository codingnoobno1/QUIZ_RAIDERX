// app/layout.jsx (or app/layout.tsx)


import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Quiz Raider X',
  description: 'A sleek coding interface',
};

export default function RootLayout({ children }) {
  return (
    <div className={`${inter.className} bg-white text-neutral-900`}>
      {children}
    </div>
  );
}
