import { Fraunces, DM_Sans } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

export const metadata = {
  title: 'Our Block — Burbank Block 1',
  description:
    'A neighbor-led initiative to keep our block clean, friendly, and proud. N Niagara St · N Catalina St · Burbank, CA.',
  openGraph: {
    title: 'Our Block — Burbank Block 1',
    description: 'Friendly signs, free bag stations, and neighbors helping neighbors.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="bg-cream font-body text-ink antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
