import React, { useState } from "react";
import MarkdownViewer from "./MarkdownViewer";

const SettingPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("基本資料");
  const [copySuccess, setCopySuccess] = useState(false);
  const shareUrl = window.location.origin + "?id=27054971";
  const [markdownContent, setMarkdownContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const togglePreview = () => setIsPreviewMode(!isPreviewMode);

  const menuItems = [
    { id: "基本資料", label: "基本資料" },
    { id: "公告", label: "公告" },
    { id: "會員管理", label: "會員管理" },
    { id: "訪問許可權", label: "訪問許可權" },
    { id: "會員申請管理", label: "會員申請管理" },
    { id: "黑名單管理", label: "黑名單管理" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "基本資料":
        return (
          <>
            <div className="flex mb-8">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <label className="w-20 text-right text-sm">名稱</label>
                    <input
                      type="text"
                      value="@笑臉馴江湖OL - 過見未來"
                      className="flex-1 p-1 border rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="w-20 text-right text-sm">ID</label>
                    <input
                      type="text"
                      value="27054971"
                      className="w-32 p-1 border rounded text-sm"
                      readOnly
                    />
                  </div>
                  <div className="flex items-start gap-4 mb-2">
                    <label className="w-20 text-right text-sm">口號</label>
                    <textarea className="flex-1 p-2 border rounded text-sm h-20" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">類型</label>
                    <select className="p-1 border rounded text-sm">
                      <option>遊戲</option>
                      <option>音樂</option>
                      <option>原神</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">等級</label>
                    <input
                      type="number"
                      value="8"
                      className="w-20 p-1 border rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">創建時間</label>
                    <input
                      type="text"
                      value="2014-10-11 19:15:44"
                      className="w-48 p-1 border rounded text-sm"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">時數統計</label>
                    <input
                      type="text"
                      value="4157"
                      className="w-20 p-1 border rounded text-sm"
                    />
                    <span className="text-yellow-500">⭐</span>
                  </div>
                </div>
              </div>

              {/* 頭像區域 */}
              <div className="w-48 flex flex-col items-center">
                <img
                  src="/logo_server_def.png"
                  alt="Avatar"
                  className="w-32 h-32 border-2 border-gray-300 mb-2"
                />
                <button className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm">
                  更換圖像
                </button>
              </div>
            </div>

            {/* 網址和介紹 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm">網址 {shareUrl}</label>
                <button
                  onClick={handleCopy}
                  className={`text-sm transition-colors ${
                    copySuccess
                      ? "text-green-600 hover:text-green-700"
                      : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {copySuccess ? "已複製!" : "複製"}
                </button>
              </div>

              <div>
                <label className="block text-sm mb-1">介紹</label>
                <textarea className="w-full h-32 p-2 border rounded text-sm" />
              </div>
            </div>
          </>
        );
      case "公告":
        return (
          <div className="space-y-4">
            {/* 工具欄 */}
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">公告編輯</label>
              <button
                onClick={togglePreview}
                className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded"
              >
                {isPreviewMode ? "編輯" : "預覽"}
              </button>
            </div>

            {/* 內容區域 */}
            <div className="border rounded p-4">
              {isPreviewMode ? (
                // 預覽模式
                <div className="prose prose-sm max-w-none">
                  <MarkdownViewer markdownText={markdownContent} />
                </div>
              ) : (
                // 編輯模式
                <textarea
                  className="w-full p-2 rounded text-sm min-h-[200px] font-mono"
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="在此輸入 Markdown 內容..."
                />
              )}
            </div>

            {/* Markdown 語法提示 */}
            {!isPreviewMode && (
              <div className="text-xs text-gray-500">
                支援 Markdown 語法：
                <span className="font-mono">
                  **粗體**, *斜體*, # 標題, - 列表, ```程式碼```,
                  [連結](https://)
                </span>
              </div>
            )}
          </div>
        );
      case "會員管理":
        return <div>會員管理內容</div>;
      case "訪問許可權":
        return <div>訪問許可權內容</div>;
      case "會員申請管理":
        return <div>會員申請管理內容</div>;
      case "黑名單管理":
        return <div>黑名單管理內容</div>;
      default:
        return null;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);

      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div
      id="modal"
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center`}
    >
      <div className="flex flex-col w-[800] h-[700] bg-white rounded shadow-lg overflow-hidden transform outline-g">
        {/* 頂部標題列 */}
        <div className="bg-blue-600 p-2 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/rc_logo_small.png" alt="Logo" className="w-5 h-5" />
            <span>@笑臉馴江湖OL - 過見未來</span>
          </div>
        </div>

        {/* 左側選單欄 */}
        <div className="flex flex-1 min-h-0">
          <div className="w-40 bg-blue-50 p-4 space-y-2 text-sm">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`cursor-pointer rounded transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-100 font-bold"
                    : "hover:bg-blue-100/50"
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* 右側內容區 */}
          <div className="flex-1 p-6">{renderContent()}</div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 p-4 bg-gray-50">
          <button
            className="px-6 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => onClose()}
          >
            保存
          </button>
          <button
            className="px-6 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => onClose()}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
