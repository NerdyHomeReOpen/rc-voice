%% 完整的聊天系統 ER 圖
erDiagram
%% 核心實體關係
Server ||--o{ Channel : contains "包含多個頻道"
Server ||--o{ ServerMember : has "擁有多個成員"

ServerMember ||--|| User : is "代表一個使用者"
ServerMember ||--|| UserPresence : has "擁有當前狀態"

%% 頻道
Channel {
string id PK "頻道唯一識別碼"
string serverId FK "所屬伺服器 ID"
string name "頻道名稱"
string type "頻道類型(text/voice/category/announcement)"
string permission "頻道可見性(public/private)"
array allowedUsers "允許訪問的使用者 ID 列表(僅 private 時使用)"
boolean isLobby "是否為大廳"
string parentId FK "父頻道 ID"
object settings "頻道特定設定"
}

%% 伺服器成員關係
ServerMember {
string id PK "成員唯一識別碼"
string serverId FK "所屬伺服器 ID"
string userId FK "使用者 ID"
string nickname "群暱稱"
string color "名稱顏色"
int permission "權限等級(0:一般成員/1:管理員/2:擁有者)"
array managedChannels "可管理的頻道 ID 列表"
int contribution "貢獻度"
datetime joinedAt "加入時間"
}

    ServerMember ||--|| UserPresence : has "擁有當前狀態"
    User ||--o{ Message : sends "發送訊息"
    User ||--o{ NotificationSetting : has "擁有通知設定"
    User ||--o{ UserBlock : blocks "封鎖其他使用者"
    User ||--o{ UserPost : publishes "發布動態"

    %% 核心實體：伺服器
    Server {
        string id PK "伺服器唯一識別碼"
        string name "伺服器名稱"
        string announcement "伺服器公告"
        string icon "伺服器圖示URL"
        string lobbyId FK "大廳頻道ID"
        int level "伺服器等級"
        int displayId "顯示ID"
        string ownerId FK "擁有者ID"
        object settings "伺服器設定"
        timestamp createdAt "創建時間"
    }

    %% 核心實體：使用者
    User {
        string id PK "使用者唯一識別碼"
        string name "使用者名稱"
        string account "登入帳號"
        string password "加密後密碼"
        string gender "性別"
        int level "使用者等級"
        string state "線上狀態"
        string signature "個人簽名"
        object settings "使用者設定"
        object recommendedServers
        object joinedServers
        timestamp createdAt "創建時間"
    }

    %% 使用者封鎖
    UserBlock {
        string id PK "封鎖ID"
        string userId FK "使用者ID"
        string blockedId FK "被封鎖用戶ID"
        string reason "封鎖原因"
        timestamp createdAt "封鎖時間"
    }

    %% 通知設定
    NotificationSetting {
        string id PK "設定ID"
        string userId FK "使用者ID"
        string targetId "目標ID"
        string type "目標類型(server/channel)"
        string level "通知等級"
        boolean muted "是否靜音"
        array suppressedEvents "停用的通知事件"
    }

    %% 訊息系統
    Message {
        string id PK "訊息識別碼"
        string channelId FK "頻道ID"
        string senderId FK "發送者ID"
        string type "訊息類型"
        string content "訊息內容"
        boolean pinned "是否置頂"
        timestamp createdAt "發送時間"
        timestamp editedAt "編輯時間"
    }

    %% 訊息附件
    MessageAttachment {
        string id PK "附件識別碼"
        string messageId FK "訊息ID"
        string type "附件類型"
        string url "附件URL"
        object metadata "附件元數據"
    }

    %% 使用者當前狀態
    UserPresence {
        string id PK "狀態識別碼"
        string userId FK "使用者ID"
        string currentServerId FK "當前伺服器ID"
        string currentChannelId FK "當前頻道ID"
        string status "狀態(online/offline/away)"
        string customStatus "自訂狀態訊息"
        timestamp lastActiveAt "最後活動時間"
        timestamp updatedAt "狀態更新時間"
    }

    %% 語音狀態
    VoiceState {
        string id PK "語音狀態ID"
        string userId FK "使用者ID"
        string channelId FK "語音頻道ID"
        boolean isMuted "是否靜音"
        boolean isDeafened "是否耳機靜音"
        boolean isSpeaking "是否正在說話"
        timestamp joinedAt "加入時間"
    }

    %% 新增好友動態相關實體
    UserPost {
        string id PK "動態識別碼"
        string userId FK "發布者ID"
        string content "動態內容"
        string visibility "可見範圍(friends)"
        timestamp createdAt "發布時間"
    }

    %% 好友分類
    FriendCategory {
        string id PK "好友分類ID"
        string userId FK "使用者ID"
        string name "分類名稱"
        array friendIds "好友ID列表"
        int order "排序"
        timestamp createdAt "創建時間"
    }

    %% 直接訊息
    DirectMessage {
        string id PK "訊息ID"
        string senderId FK "發送者ID"
        string receiverId FK "接收者ID"
        string content "訊息內容"
        string type "訊息類型"
        string status "狀態"
        timestamp createdAt "發送時間"
    }

    User ||--o{ ServerMember : "is"
    User ||--o{ Message : "sends"
    User ||--o{ UserPost : "creates"
    User ||--o{ UserPresence : "has"
    User ||--o{ VoiceState : "has"
    User ||--o{ FriendCategory : "owns"
    User ||--o{ DirectMessage : "sends"
    User ||--o{ DirectMessage : "receives"
    User ||--o{ UserBlock : "blocks"
    Server ||--|{ Channel : "contains"
    Server ||--o{ ServerMember : "has"
    Channel ||--o{ Message : "contains"
    Channel ||--o{ VoiceState : "hosts"
