# RiceCall

<div align="center">
  <img src="https://github.com/user-attachments/assets/74f23cae-f3aa-4deb-bbd1-72290d9193f3" width="200px" align="center">
</div>

<img src="https://img.shields.io/badge/Join-Discord-blue?logo=discord&link=https%3A%2F%2Fdiscord.gg%2FadCWzv6wwS"/> <img src="https://img.shields.io/badge/Latest-v0.1.3-green"/>

RiceCall，RaidCall 的非官方復刻版，使用 react 框架開發，electron 建置

## - 功能 (Feature)

- 高度還原 RaidCall 介面和功能
- 重溫曾經的情懷

## - v0.1.4 更新日誌 (Change Log)

- 修復掛機一小時無法正常獲取經驗值及貢獻
- 修復私訊介面接收錯誤私訊內容
- 修復下麥後調整麥克風音量會自動開啟麥克風
- 修復在其他分頁點擊離開語音群會產生不正常行為
- 修復語音群設定不會自動更新資料
- 修復進入語音群會顯示歷史訊息
- 修復一些選項的權限問題
- 優化頻道位元率更新邏輯，避免頻繁更新
- 新增麥克風音量圖示
- 新增頻道發話圖示
- 新增加入、離開、頻道訊息通知音效
- 新增踢出語音群功能
- 新增公告可添加影片及音檔
- 新增連線至語音群提示
- 新增延遲圖標功能，會正常顯示與伺服器的連線狀態
- 調整 VIP 名字及名片顏色
- 調整大廳名字顏色
- 修改 Logo icon

## - 安裝方法

請至 [下載點](https://github.com/NerdyHomeReOpen/RiceCall/releases/latest)，先閱讀過說明文件後再開始下載

## - 常見問題 (FAQ)

### :question: Q: 我卡在轉圈圈畫面怎麼辦

:white_check_mark: A: 請從右上角選單 -> 登出，然後再登入一次

### :question: Q: 我沒辦法加入伺服器

:white_check_mark: A: 請從右上角選單 -> 登出，然後再登入一次

### :question: Q: 我語音一直沒聲音

:white_check_mark: A: 如果你正在使用學校、公司等網路，可能會導致連線不到，請換一個網路連線，目前還沒有根除方法

### :question: Q: 我開機自動啟動後沒有連線

:white_check_mark: A: 重新啟動應用程式再試一次

### :question: Q: 我的問題不在以上的內容中

:white_check_mark: A: 請加入我們的 [Discord](https://discord.gg/adCWzv6wwS) 伺服器或至 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 頁面詳細描述你所遇到的問題

## - 技術架構 (Tech Stack)

- **前端 (Client):** React, Electron
- **後端 (Server):** Node.js
- **資料庫 (Database):** SQLite
- **通訊協定 (Protocol):** WebRTC / WebSocket

## - 如何貢獻 (Contributing)

我們歡迎所有開發者參與 RiceCall 的開發！你可以透過以下方式貢獻：

1. Fork 此專案，進行修改後提交 [Pull Request](https://github.com/NerdyHomeReOpen/RiceCall/pulls)
2. 回報 Bug 或提出新功能建議，請到 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 頁面
3. 幫助改善文件 (如 ReadMe 或開發指南)

### 代辦事項 (TODO List)

- [ ] 更改後端語言 (e.g. Rust, C++, Python)
- [ ] 優化資料庫 (NoSQL)
- [ ] 改進 WebRTC (SFU)
- [ ] 新增雜音抑制
- [ ] 混音功能

## - 專案倉庫 (Repository)

| Repo                                                                                          | Role     |
| --------------------------------------------------------------------------------------------- | -------- |
| [/NerdyHomeReOpen/RiceCall](https://github.com/NerdyHomeReOpen/RiceCall)                      | frontend |
| [/NerdyHomeReOpen/RiceCallServer](https://github.com/NerdyHomeReOpen/RiceCall/tree/Websocket) | backend  |

## - 專案架構 (Framework)

```bash
RiceCall
├── public/                   # 靜態資源 (圖片、icons 等)
├── resources/                # Electron 打包相關資源
├── src/                      # 應用程式的主要原始碼
│   ├── app/                  # Next.js 頁面
│   ├── components/           # React/Electron 元件
│   ├── providers/            # React Providers
│   ├── styles/               # CSS
│   ├── services/             # API 呼叫、資料處理
├── main.js                   # Electron 入口文件
├── .env.example              # 環境變數範例
├── .gitignore                # Git 忽略清單
├── .prettierrc               # Prettier 設定
├── dev-app-update.yml        # 應用程式更新設定 (Electron auto-update)
├── Dockerfile                # Docker 部署設定
├── electron-builder.json     # Electron 打包設定
├── eslint.config.mjs         # ESLint 設定
├── LICENSE                   # 專案授權
├── package.json              # npm/yarn 依賴管理
├── postcss.config.mjs        # PostCSS 設定
├── README.md                 # 專案說明文件
├── tsconfig.json             # TypeScript 設定
├── yarn.lock                 # Yarn 鎖定依賴版本
```

## - 建置本地環境 (Build)

1. 安裝 Modules

```bash
yarn install
```

2. 啟動 Client

```bash
yarn electron-dev
```

3. 啟動 Server (前端開發用)

```bash
node ./index.js
``` 

4. 建置 Database

```bash
node ./initial.js
```

客戶端及伺服器即會運行於本地電腦上

> [客戶端](localhost:3000) (localhost:3000)
> 
> [伺服器端](localhost:4500) (localhost:4500)

## - 免責聲明 (Disclaimer)

**RiceCall** 是一個**獨立開發**的專案，與 RaidCall 的原開發團隊、伺服器或任何官方組織 **沒有任何關聯**。本專案**並非** RaidCall 的延續或官方授權版本，亦**不涉及恢復過去的 RaidCall 服務或其伺服器**。

RiceCall 的開發純屬愛好者社群的自主行動，目的在於提供一個新的語音交流平台，並非商業化項目。本專案可能會參考或取用部分 RaidCall 相關的素材，但所有內容皆屬我們的獨立創作，且不代表 RaidCall 官方立場或意圖。

如有任何與 RaidCall 相關的問題，請直接聯繫其原開發團隊或官方渠道。**RiceCall 不負責與 RaidCall 相關的任何技術支援**、帳號恢復或資料遺失等問題。

本專案完全獨立開發，所有內容僅供學術研究與技術交流使用。如涉及任何版權、商標或其他權利問題，請聯繫我們進行溝通。
