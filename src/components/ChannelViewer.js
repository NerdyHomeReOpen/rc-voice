import React, { useState } from "react";

import {
  Plus,
  Minus,
  Dot,
  House,
  MoreVertical,
  Edit,
  Trash,
} from "lucide-react";

const ChannelViewer = ({ channels, callBack }) => {
  const [expandedSections, setExpandedSections] = useState(
    channels.reduce((acc, channel) => {
      if (channel.id) acc[channel.id] = true;
      return acc;
    }, {})
  );
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    channel: null,
  });
  const [addingChannel, setAddingChannel] = useState({
    visible: false,
    channel: null,
  });
  const [newChannel, setNewChannel] = useState({
    name: "",
    permission: "public",
    id: "",
    isLobby: false,
  });
  const [editingChannel, setEditingChannel] = useState({
    visible: false,
    channel: null,
  });
  const [editChannel, setEditChannel] = useState({
    name: "",
    permission: "public",
    id: "",
    isLobby: false,
  });

  // Handle event
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const openContextMenu = (e, id) => {
    e.preventDefault();
    const allChannels = channels.reduce((acc, item) => {
      if (item.channels) {
        return acc.concat(item.channels);
      }
      return acc.concat(item);
    }, []);
    const channel = allChannels.find((_) => _.id === id);
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      channel: channel,
    });
  };
  const handleAddChannel = (id = null) => {
    // REWRITE THIS //
    if (!newChannel.name.trim()) {
      // warn
    }
    callBack((prev) => {
      if (id) {
        // Adding to existing category
      } else {
        // Creating new channel
      }
    });
  };
  const handleEditChannel = (id = null) => {
    // REWRITE THIS //
    callBack((prev) => {
      if (id) {
      } else {
      }
    });
  };
  const handleDeleteChannel = (id = null) => {};

  const getPermissionStyle = (permission) => {
    switch (permission) {
      case "private":
        return "bg-blue-100";
      case "readonly":
        return "bg-gray-300";
      default:
        return "bg-white";
    }
  };

  const createChannel = (channel, id = null) => {
    const renderUsers = (users) => {
      if (!users || users.length === 0) return null;
      return (
        <div className="ml-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex p-1 items-center justify-between hover:bg-gray-100 group select-none"
            >
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center mr-1`}
                >
                  <img
                    src={`/channel/UserIcons${user.gender}_${user.permission}_14x16.png`}
                    alt={user.name}
                    className="select-none"
                  />
                </div>
                <span className="truncate">{user.name}</span>
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div key={channel.id}>
        <div
          className="flex p-1 items-center justify-between hover:bg-gray-100 group select-none"
          onContextMenu={(e) => openContextMenu(e, channel.id)}
          onClick={() => toggleSection(channel.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div
              className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 ${getPermissionStyle(
                channel.permission
              )}`}
            >
              {channel.isLobby ? (
                <House size={12} />
              ) : channel.permission === "readonly" ? (
                <Dot size={12} />
              ) : expandedSections[channel.id] ? (
                <Minus size={12} />
              ) : (
                <Plus size={12} />
              )}
            </div>
            <span className="truncate">{channel.name}</span>
            <span className="ml-1 text-gray-500 text-sm">
              {channel.permission !== "readonly" && `(${channel.users.length})`}
            </span>
          </div>
          {!channel.isLobby && (
            <button
              className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                openContextMenu(e, channel.id);
              }}
            >
              <MoreVertical size={14} />
            </button>
          )}
        </div>
        {expandedSections[channel.id] && renderUsers(channel.users)}
      </div>
    );
  };

  return (
    <>
      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white shadow-lg rounded border py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              setEditingChannel((prev) => ({
                channel: contextMenu.channel,
                visible: true,
              }));
              setEditChannel(contextMenu.channel);
            }}
          >
            <Edit size={14} className="mr-2" />
            編輯頻道
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600"
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              handleDeleteChannel(contextMenu.channel.id);
            }}
          >
            <Trash size={14} className="mr-2" />
            刪除頻道
          </button>
        </div>
      )}

      {/* Add Channel Modal */}
      {addingChannel.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-80">
            <h3 className="text-lg font-bold mb-4">新增頻道</h3>
            <input
              type="text"
              value={newChannel.name}
              onChange={(e) =>
                setNewChannel((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full p-2 border rounded mb-4"
              placeholder="頻道名稱"
            />
            <select
              value={newChannel.permission}
              onChange={(e) =>
                setNewChannel((prev) => ({
                  ...prev,
                  permission: e.target.value,
                }))
              }
              className="w-full p-2 border rounded mb-4"
            >
              <option value="public">公開</option>
              <option value="private">私人</option>
              <option value="readonly">唯讀</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setAddingChannel((prev) => ({ ...prev, visible: false }));
                  setNewChannel({
                    name: "",
                    permission: "public",
                    id: "",
                    isLobby: false,
                  });
                }}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setAddingChannel((prev) => ({ ...prev, visible: false }));
                  handleAddChannel(addingChannel.channel.id);
                  setNewChannel({
                    name: "",
                    permission: "public",
                    id: "",
                    isLobby: false,
                  });
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {editingChannel.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-80">
            <h3 className="text-lg font-bold mb-4">編輯頻道</h3>
            <input
              type="text"
              value={editingChannel.channel.name}
              onChange={(e) =>
                setEditChannel((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setEditingChannel((prev) => ({ ...prev, visible: false }));
                  setEditChannel({
                    name: "",
                    permission: "public",
                    id: "",
                    isLobby: "",
                  });
                }}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setEditingChannel((prev) => ({ ...prev, visible: false }));
                  handleEditChannel(editingChannel.channel.id);
                  setEditChannel({
                    name: "",
                    permission: "public",
                    id: "",
                    isLobby: "",
                  });
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {[...channels].map((channel, index) => {
        if (channel.channels) {
          // Render category
          return (
            <div key={channel.id} className="mb">
              <div
                className="flex p-1 items-center justify-between hover:bg-gray-100 group select-none whitespace-nowrap overflow-hidden"
                onClick={() => toggleSection(channel.id)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 ${getPermissionStyle(
                      channel.permission
                    )}`}
                  >
                    {channel.permission === "readonly" ? (
                      <Dot size={12} />
                    ) : expandedSections[channel.id] ? (
                      <Minus size={12} />
                    ) : (
                      <Plus size={12} />
                    )}
                  </div>
                  <span>{channel.name}</span>
                </div>
                {channel.permission !== "readonly" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingChannel({
                        visible: true,
                        channel: channel,
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {expandedSections[channel.id] && channel.channels?.length > 0 && (
                <div className="ml-6">
                  {channel.channels.map((subChannel) =>
                    createChannel(subChannel, true)
                  )}
                </div>
              )}
            </div>
          );
        }
        // Render single channel
        return createChannel(channel);
      })}
    </>
  );
};

export default ChannelViewer;
