// client/src/customer/CustomerChat.jsx
import { useEffect, useState, useRef } from "react";
import {
  ingestMessage,
  fetchConversation,
  initializeCustomerSocket,
  startNewConversation,
  getCurrentCustomerId,
  endConversation,
} from "../api";

export default function CustomerChat() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [conversationStatus, setConversationStatus] = useState("active");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const socket = initializeCustomerSocket();
    const customerId = getCurrentCustomerId();

    // Load existing conversation if available
    const savedConvId = localStorage.getItem("customerConversationId");
    if (savedConvId) {
      setConversationId(savedConvId);
      loadConversation(savedConvId);
    }

    // Listen for agent replies
    socket.on("agent_reply", ({ conversationId: msgConvId, message }) => {
      const currentConvId = localStorage.getItem("customerConversationId");
      if (msgConvId === currentConvId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
    });

    // Listen for conversation status changes
    socket.on("conversation_ended", ({ status }) => {
      setConversationStatus(status);
      alert("Conversation closed by support team.");
    });

    socket.on("conversation_escalated", ({ status }) => {
      setConversationStatus(status);
      alert("Conversation escalated to specialized team.");
    });

    return () => {
      socket.off("agent_reply");
      socket.off("conversation_ended");
      socket.off("conversation_escalated");
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConversation(convId) {
    try {
      const data = await fetchConversation(convId);
      setMessages(data.messages);
      setConversationStatus(data.status || "active");
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }

  async function send() {
    if (!text.trim() || isSending || conversationStatus !== "active") return;

    setIsSending(true);
    try {
      const response = await ingestMessage(text);

      if (response.conversationId) {
        setConversationId(response.conversationId);
        localStorage.setItem("customerConversationId", response.conversationId);
      }

      if (response.message) {
        setMessages((prev) => [...prev, response.message]);
      }
      setText("");
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleStartNewConversation = async () => {
    try {
      await startNewConversation();
      localStorage.removeItem("customerConversationId");
      setConversationId(null);
      setMessages([]);
      setText("");
      setConversationStatus("active");
    } catch (error) {
      console.error("Error starting new conversation:", error);
    }
  };

  const handleEndConversation = async () => {
    if (!conversationId) return;
    if (!window.confirm("End this conversation?")) return;

    try {
      await endConversation(conversationId);
      setConversationStatus("resolved");
      alert("Conversation ended.");
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Support Chat</h1>
          {conversationId && conversationStatus === "active" && (
            <div className="flex gap-2">
              <button
                onClick={handleStartNewConversation}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                New Chat
              </button>
              <button
                onClick={handleEndConversation}
                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                End Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Type a message in any language to start
            </div>
          ) : (
            messages.map((m, i) => {
              const isCustomer = m.role === "customer";
              const displayText = isCustomer
                ? m.original_text
                : m.translated_text;

              return (
                <div
                  key={i}
                  className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      isCustomer
                        ? "bg-blue-500 text-white"
                        : "bg-white border text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{displayText}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          {conversationStatus === "active" ? (
            <div className="flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded resize-none focus:outline-none focus:border-blue-500"
                rows={2}
                disabled={isSending}
              />
              <button
                onClick={send}
                disabled={!text.trim() || isSending}
                className="px-6 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Conversation is {conversationStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
