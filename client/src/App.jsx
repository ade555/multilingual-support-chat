// client/src/App.jsx

import { useState } from "react";
import Inbox from "./agent/Inbox";
import CustomerChat from "./customer/CustomerChat";
import LanguageSelector from "./utils/LanguageSelector";

const App = () => {
  const path = window.location.pathname;
  const [agentLanguage, setAgentLanguage] = useState(
    localStorage.getItem("agentLanguage") || null,
  );

  const handleLanguageSelect = (lang) => {
    setAgentLanguage(lang);
    localStorage.setItem("agentLanguage", lang);
  };

  if (path.startsWith("/agent")) {
    if (!agentLanguage) {
      return <LanguageSelector onSelect={handleLanguageSelect} />;
    }
    return <Inbox />;
  }

  if (path.startsWith("/customer")) {
    return <CustomerChat />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Multilingual Support Chat
        </h1>

        <div className="grid grid-cols-2 gap-6">
          <a
            href="/agent"
            className="p-8 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border"
          >
            <h3 className="text-xl font-bold mb-2">Agent Workspace</h3>
            <p className="text-gray-600">
              View and respond to customer messages
            </p>
          </a>

          <a
            href="/customer"
            className="p-8 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border"
          >
            <h3 className="text-xl font-bold mb-2">Customer Chat</h3>
            <p className="text-gray-600">Send messages in any language</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
