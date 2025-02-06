# Rice call

這是 Raidcall 的網頁非官方復刻版 Ricecall，目前尚處於開發階段，若有興趣歡迎於 Discord 一同參與討論

### ->[Discord 群組](https://discord.gg/adCWzv6wwS)<-

## 使用方法

若是想參與測試開發版本，此 repo 的 branch 分別為：

| branch      | role   |
| ----------- | ------ |
| `ts-refactor`    | client / test-server |
| `Websocket` | server |

## 如何啟動

### 優先安裝 modules

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install
```

### 啟動 Client

```bash
# 使用 npm
npm run dev

# 使用 yarn
yarn dev
```

### 啟動 Test-Server (前端設計調適用)

```bash
node /test-server/index.js
```

### 啟動 Server

```bash
node index.js
```

客戶端及伺服器即會運行於本地電腦上

> [客戶端](localhost:3000) (預設為 port3000)
>
> [伺服器端](localhost:4500) (預設為 port4500)

## 免責聲明

**RiceCall** 是一個**獨立開發**的專案，與 RaidCall 的原開發團隊、伺服器或任何官方組織 **沒有任何關聯**。本專案**並非** RaidCall 的延續或官方授權版本，亦**不涉及恢復過去的 RaidCall 服務或其伺服器**。

RiceCall 的開發純屬愛好者社群的自主行動，目的在於提供一個新的語音交流平台，並非商業化項目。本專案可能會參考或取用部分 RaidCall 相關的素材，但所有內容皆屬我們的獨立創作，且不代表 RaidCall 官方立場或意圖。

如有任何與 RaidCall 相關的問題，請直接聯繫其原開發團隊或官方渠道。**RiceCall 不負責與 RaidCall 相關的任何技術支援**、帳號恢復或資料遺失等問題。

本專案完全獨立開發，所有內容僅供學術研究與技術交流使用。如涉及任何版權、商標或其他權利問題，請聯繫我們進行溝通。
