import React, { useState } from "react";

// Service
import userService from "@/service/user.service";

// Types
import type { User, MenuItem } from "@/types";

interface PersonalSettingPageProps {
  onClose: () => void;
  user: User;
}

const PersonalSettingPage: React.FC<PersonalSettingPageProps> = ({
  onClose,
  user,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const menuItems: MenuItem[] = [{ id: "基本資料", label: "基本資料" }];
  const [activeTab, setActiveTab] = useState("基本資料");

  // Default user data
  const [preview, setPreview] = useState("/im/IMLogo.png");
  const [userName, setUserName] = useState(user?.name || "");
  const [selectedGender, setSelectedGender] = useState(user?.gender || "Male");

  // const handleFileChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setPreview(reader.result);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleSave = async () => {
    if (userName !== user.name || selectedGender !== user.gender) {
      console.log(user);
      try {
        setIsLoading(true);
        setError("");

        const response = await userService.updateProfile({
          userId: user.id,
          name: userName,
          gender: selectedGender,
        });

        localStorage.setItem(
          "userData",
          JSON.stringify({
            ...user,
            name: userName,
            gender: selectedGender,
          })
        );
        console.log(response);
        onClose();
      } catch (err: Error | any) {
        setError(err.message || "Save failed");
      }
    } else {
      onClose();
    }
    setIsLoading(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "基本資料":
        return (
          <>
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <div className="flex mt-8">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-2 select-none">
                    <label className="w-20 text-right text-sm">顯示名稱</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="flex-1 p-1 border rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="w-20 text-right text-sm select-none">
                      ID
                    </label>
                    <input
                      type="text"
                      value="27054971"
                      className="w-32 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4 select-none">
                    <label className="w-20 text-right text-sm select-none">
                      性別
                    </label>
                    <select
                      value={selectedGender}
                      onChange={(e) =>
                        setSelectedGender(e.target.value as "Male" | "Female")
                      }
                      className="p-1 border rounded text-sm"
                    >
                      <option value="Male">男性</option>
                      <option value="Female">女性</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 select-none">
                    <label className="w-20 text-right text-sm">創建時間</label>
                    <label className="w-48 p-1 rounded text-sm">
                      {new Date(user?.createdAt || 0).toLocaleString()}
                    </label>
                  </div>

                  <div className="flex justify-center select-none">
                    <button
                      className="px-6 py-1 mt-5 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => {
                        localStorage.removeItem("userData");
                        window.location.reload();
                      }}
                    >
                      登出
                    </button>
                  </div>
                </div>
              </div>

              {/* 頭像區域 */}
              <div className="w-48 flex flex-col items-center select-none">
                <img
                  src={preview}
                  alt="Avatar"
                  className="w-32 h-32 border-2 border-gray-300 mb-2 rounded-full object-cover"
                />
                <button className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm">
                  更換頭像
                </button>
                {/* <label className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm cursor-pointer transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  更換頭像
                </label> */}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="modal"
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}
    >
      <div className="flex flex-col w-[800] h-[700] bg-white rounded shadow-lg overflow-hidden transform outline-g">
        {/* 頂部標題列 */}
        <div className="bg-blue-600 p-2 text-white flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <img src="/rc_logo_small.png" alt="Logo" className="w-5 h-5" />
            <span>個人資料設定</span>
          </div>
        </div>

        {/* 左側選單欄 */}
        <div className="flex flex-1 min-h-0">
          <div className="w-40 bg-blue-50 text-sm">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`cursor-pointer rounded transition-colors select-none px-4 py-1 ${
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
        <div className="flex justify-end gap-2 p-4 bg-gray-50  select-none">
          <button
            className="px-6 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            onClick={handleSave}
            disabled={
              isLoading ||
              (userName === user.name && selectedGender === user.gender)
            }
          >
            {isLoading ? "保存中..." : "保存"}
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

PersonalSettingPage.displayName = "PersonalSettingPage";

export default PersonalSettingPage;
