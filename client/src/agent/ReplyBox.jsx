import { useState } from "react";
import { sendReply } from "../api";

export default function ReplyBox({ conversationId, onReplySent }) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function send() {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await sendReply(conversationId, text);
      if (response.message && onReplySent) {
        onReplySent(response.message);
      }
      setText("");
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

  return (
    <div className="p-4 max-w-3xl mx-auto w-full">
      <div className="bg-gray-50 rounded border focus-within:border-blue-500">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your reply... (Press Enter to send)"
          className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm"
          rows={3}
          disabled={isSending}
        />

        <div className="flex items-center justify-end px-4 pb-3">
          <button
            onClick={send}
            disabled={!text.trim() || isSending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Your reply will be automatically translated to the customer's language
      </p>
    </div>
  );
}
