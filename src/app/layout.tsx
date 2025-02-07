import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Theme } from '@radix-ui/themes';

// .css
import './globals.css';
import '@radix-ui/themes/styles.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RiceCall',
  description:
    '台灣最多人使用的語音聊天軟體- RC語音(RiceCall), 可以用於線上遊戲的團隊聊天, 也可以當成線上聊天室/卡拉OK',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Theme>{children}</Theme>
      </body>
    </html>
  );
}
