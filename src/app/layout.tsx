import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recovery Credit | Debt Collection Management System',
  description: 'Enterprise Debt Collection, Bank Client Portfolios & Recovery Tracking',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Recovery Credit',
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

import { LanguageProvider } from '@/components/LanguageContext';
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              if(typeof MutationObserver!=='undefined'){
                new MutationObserver(function(mutations){
                  for(var i=0;i<mutations.length;i++){
                    var m=mutations[i];
                    if(m.type==='attributes'&&m.attributeName==='bis_skin_checked'){
                      m.target.removeAttribute('bis_skin_checked');
                    }
                  }
                }).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['bis_skin_checked']});
              }
            })();`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900`} suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
