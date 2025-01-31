/*{
    "name": "example server",
    "id": "1029301123",
        "channel":[
            channel1:
                {
                    "name": "example channel",
                    "id": "123930456",
                    "permission": "public"
                    "isLobby": false,
                    "users": []
                    "channels": [
                        {
                        "name": "example sub-channel",
                        "id": "123930457",
                        "permission": "private"
                        "isLobby": false,
                        "users": [
                            "043860825720934",
                            "043860825720935"
                        ]
                }
  ]
}
      ]
    }
  ]
}*/

const API_URL = "http://server/api/server";

// This is from database
const serverList = {
  1029301123: {
    name: "example server",
    id: "1029301123",
    channel: ["1234567890", "0987654321"],
    users: ["043860825720934", "0129491597595414"],
  },
  1029301124: {
    name: "example server2",
    id: "1029301124",
    channel: ["1234567890", "0987654321"],
    users: ["043860825720934", "0129491597595414"],
  },
};
const channelList = {
  1234567890: {
    name: "example channel",
    id: "1234567890",
    permission: "public",
    isLobby: false,
    users: ["043860825720934", "043860825720935"],
  },
};
const messageList = {
  1234567890: {
    1234567890: [
      {
        id: "1234567890",
        content: "Hello",
        timestamp: "2021-09-01T12:00:00Z",
        sender: "043860825720934",
      },
    ],
  },
};
const userList = {
  "043860825720934": {
    id: "043860825720934",
    name: "example user",
  },
};

const axios = equire("axios");

async function fetchData(url, id) {
  try {
    const response = await axios.get(url);
    const data = JSON.parse(response.data ?? "{}");
    if (data[id]) {
      return data[id];
    } else {
      console.log(`No data found for ID ${id}`);
      return null;
    }
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to fetch data from ${url}`);
  }
}

async function getServerData(ServerID) {
  return await fetchData(`${API_URL}/server/?ServerId=${ServerID}`, ServerID);
}

async function getChannelData(ChannelID) {
  return await fetchData(
    `${API_URL}/channel/?ChannelId=${channelID}`,
    ChannelID
  );
}

async function getMessageData(MessageID) {
  return await fetchData(
    `${API_URL}/message/?MessageId=${MessageID}`,
    MessageID
  );
}

async function getUserData(UserID) {
  return await fetchData(`${API_URL}/user/?UserId=${UserID}`, ChannelID);
}

export default {
  getServerData,
  getChannelData,
  getMessageData,
  getUserData,
};
