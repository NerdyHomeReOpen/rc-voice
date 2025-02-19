import type { Metadata } from 'next';
import { Html, Head, Main, NextScript } from 'next/document';

// .css
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'RiceCall',
  description:
    '台灣最多人使用的語音聊天軟體- RC語音(RiceCall), 可以用於線上遊戲的團隊聊天, 也可以當成線上聊天室/卡拉OK',
};

export default function Document() {
  return (
    <Html lang="zh-TW">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
