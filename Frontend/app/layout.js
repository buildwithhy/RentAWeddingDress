// import { Jost } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';

// const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '500'] });

export const metadata = {
  title: 'WedDress — Rent Your Dream Look',
  description: "Pakistan's premier wedding dress rental platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* <body className={jost.className}> */}
      <body>
        <Navbar />
        <main>{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: '13px',
              borderRadius: '0px',
              border: '1px solid #E8E0E4',
              background: '#FAF7F2',
              color: '#1A1218',
            },
          }}
        />
      </body>
    </html>
  );
}
