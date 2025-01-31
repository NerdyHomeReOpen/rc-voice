import { useRef, useLayoutEffect } from "react";

import MarkdownViewer from "./MarkdownViewer";

const MessageViewer = ({ messages }) => {
  const messagesEndRef = useRef(null);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, [messages]);

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const messageDate = new Date(timestamp);
    const now = new Date();

    const messageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeString = messageDate.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (messageDay.getTime() === today.getTime()) {
      return timeString;
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return `昨天 ${timeString}`;
    } else {
      return `${messageDate.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })} ${timeString}`;
    }
  };

  // Group messages by user and time window
  const groupMessages = (msgs) => {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    const grouped = [];
    let currentGroup = null;

    sorted.forEach((message) => {
      if (!currentGroup) {
        // Start new group
        currentGroup = {
          messageId: message.messageId,
          user: message.user,
          timestamp: message.timestamp,
          contents: [message.content],
        };
      } else {
        const timeDiff =
          new Date(message.timestamp) - new Date(currentGroup.timestamp);
        const sameUser = message.user.id === currentGroup.user.id;

        if (sameUser && timeDiff <= 5 * 60 * 1000) {
          // 5 minutes in milliseconds
          // Add to current group
          currentGroup.contents.push(message.content);
        } else {
          // Start new group
          grouped.push(currentGroup);
          currentGroup = {
            messageId: message.messageId,
            user: message.user,
            timestamp: message.timestamp,
            contents: [message.content],
          };
        }
      }
    });

    // Add last group
    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped;
  };

  const groupedMessages = groupMessages(messages);

  return (
    <>
      {groupedMessages.map((group) => (
        <div key={group.messageId} className="flex items-start space-x-1 mb-1">
          <img
            src={`/channel/UserIcons${group.user.gender}_${group.user.permission}_14x16.png`}
            alt={group.user.id}
            className="select-none flex-shrink-0 mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="font-bold text-gray-900">{group.user.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                {formatMessageTime(group.timestamp)}
              </span>
            </div>

            <div className="text-gray-700 break-words whitespace-pre-wrap">
              <MarkdownViewer markdownText={group.contents.join("\n")} />
            </div>
            {/* <div className="text-gray-700 break-words whitespace-pre-wrap">
              
              {group.contents.join("\n")}
            </div> */}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};

export default MessageViewer;
