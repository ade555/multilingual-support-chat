import { useEffect, useState } from "react";
import {
  fetchConversations,
  initializeAgentSocket,
  onConversationUpdated,
} from "../api";
import Conversation from "./Conversation"; // we will create this later

const Inbox = () => {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadConversations() {
    setIsLoading(true);
    const data = await fetchConversations();
    setConversations(data);
    setIsLoading(false);
  }
  useEffect(() => {
    initializeAgentSocket();
    loadConversations();

    const cleanup = onConversationUpdated((updatedConv) => {
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === updatedConv.id);

        if (existing) {
          return prev
            .map((c) =>
              c.id === updatedConv.id ? { ...c, ...updatedConv } : c,
            )
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          return [updatedConv, ...prev];
        }
      });

      if (!activeId) {
        setActiveId(updatedConv.id);
      }
    });

    return cleanup;
  }, [activeId]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Agent Workspace</h1>
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-3 py-2 bg-gray-50 border rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase">
              Conversations
            </h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-600">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    c.id === activeId
                      ? "bg-blue-50 border-blue-300"
                      : "hover:bg-gray-50 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded">
                      {c.language.toUpperCase()}
                    </span>
                    {c.status !== "active" && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                        {c.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {c.lastMessage}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeId ? (
          <Conversation
            conversationId={activeId}
            onClose={() => setActiveId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a chat from the sidebar to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
