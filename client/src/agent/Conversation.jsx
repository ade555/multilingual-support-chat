import { useEffect, useState, useRef } from "react";
import {
  fetchConversation,
  onNewMessage,
  getAgentSocket,
  resolveConversation,
  escalateConversation,
} from "../api";
import ReplyBox from "./ReplyBox";

const Conversation = ({ conversationId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [showOriginal, setShowOriginal] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [conversationStatus, setConversationStatus] = useState("active");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const socket = getAgentSocket();

    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchConversation(conversationId);
        setMessages(data.messages);
        setConversationStatus(data.status || "active");
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setIsLoading(false);
      }
    }

    load();

    socket.on("conversation_ended", ({ conversationId: endedId, closedBy }) => {
      if (endedId === conversationId && closedBy === "customer") {
        setConversationStatus("resolved");
        alert("Customer has ended this conversation.");
      }
    });

    const cleanup = onNewMessage(
      socket,
      ({ conversationId: msgConvId, message }) => {
        if (msgConvId === conversationId) {
          setMessages((prev) => [...prev, message]);
          setTimeout(scrollToBottom, 100);
        }
      },
    );

    return () => {
      cleanup();
      socket.off("conversation_ended");
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleOriginal = (index) => {
    setShowOriginal((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleResolve = async () => {
    if (!window.confirm("Mark this conversation as resolved?")) return;

    try {
      await resolveConversation(conversationId);
      setConversationStatus("resolved");
    } catch (error) {
      console.error("Error resolving conversation:", error);
      alert("Failed to resolve conversation.");
    }
  };

  const handleEscalate = async () => {
    const reason = prompt("Enter escalation reason (optional):");

    try {
      await escalateConversation(conversationId, reason);
      setConversationStatus("escalated");
    } catch (error) {
      console.error("Error escalating conversation:", error);
      alert("Failed to escalate conversation.");
    }
  };

  const handleReplySent = (message) => {
    setMessages((prev) => [...prev, message]);
    setTimeout(scrollToBottom, 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              ← Back
            </button>
            <h2 className="text-lg font-semibold">Conversation</h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded text-sm ${
                conversationStatus === "active"
                  ? "bg-green-100 text-green-700"
                  : conversationStatus === "escalated"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {conversationStatus}
            </span>

            {conversationStatus === "active" && (
              <>
                <button
                  onClick={handleEscalate}
                  className="px-3 py-1 text-sm bg-yellow-50 border border-yellow-200 text-yellow-700 rounded hover:bg-yellow-100"
                >
                  Escalate
                </button>
                <button
                  onClick={handleResolve}
                  className="px-3 py-1 text-sm bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100"
                >
                  Resolve
                </button>
              </>
            )}

            {conversationStatus === "escalated" && (
              <button
                onClick={handleResolve}
                className="px-3 py-1 text-sm bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100"
              >
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-600">No messages yet</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isAgent = m.role === "agent";
              const isTranslated = m.original_text !== m.translated_text;
              const showingOriginal = showOriginal[i];

              return (
                <div
                  key={i}
                  className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-lg">
                    <div className="mb-1">
                      <span className="text-xs font-semibold text-gray-600">
                        {isAgent ? "You" : "Customer"}
                      </span>
                    </div>

                    <div
                      className={`rounded-lg px-4 py-3 ${
                        isAgent
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-900 border"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {isAgent
                          ? m.original_text
                          : showingOriginal
                            ? m.original_text
                            : m.translated_text}
                      </p>

                      {!isAgent && isTranslated && (
                        <button
                          onClick={() => toggleOriginal(i)}
                          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          {showingOriginal
                            ? "Show translation"
                            : "Show original"}
                        </button>
                      )}
                    </div>

                    {isTranslated && !isAgent && (
                      <div className="mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Auto-translated
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Box */}
      <div className="bg-white border-t">
        {conversationStatus === "resolved" ? (
          <div className="p-4 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border rounded">
              <span className="text-sm text-gray-700">
                This conversation has been resolved
              </span>
            </span>
          </div>
        ) : (
          <ReplyBox
            conversationId={conversationId}
            onReplySent={handleReplySent}
          />
        )}
      </div>
    </div>
  );
};

export default Conversation;
