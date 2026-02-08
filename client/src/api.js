// client/src/api.js
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let agentSocket = null;
let customerSocket = null;

// client/src/api.js
function getCustomerId() {
  let customerId = localStorage.getItem("customerId");
  if (!customerId) {
    customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("customerId", customerId);
  }
  return customerId;
}

export function getCurrentCustomerId() {
  return getCustomerId();
}

// client/src/api.js
export function initializeAgentSocket() {
  if (agentSocket) return agentSocket;

  agentSocket = io(API_BASE_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  agentSocket.on("connect", () => {
    console.log("[WebSocket] Connected to server");
    const language = localStorage.getItem("agentLanguage") || "en";
    agentSocket.emit("agent_join", { language });
  });

  agentSocket.on("disconnect", () => {
    console.log("[WebSocket] Disconnected from server");
  });

  return agentSocket;
}

export function initializeCustomerSocket() {
  if (customerSocket) return customerSocket;

  customerSocket = io(API_BASE_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  customerSocket.on("connect", () => {
    console.log("[WebSocket] Connected to server");
    const customerId = getCustomerId();
    customerSocket.emit("customer_join", customerId);
  });

  customerSocket.on("disconnect", () => {
    console.log("[WebSocket] Disconnected from server");
  });

  return customerSocket;
}

export function getAgentSocket() {
  if (!agentSocket) {
    initializeAgentSocket();
  }
  return agentSocket;
}

export function getCustomerSocket() {
  if (!customerSocket) {
    initializeCustomerSocket();
  }
  return customerSocket;
}

// client/src/api.js

// fetch all conversations
export async function fetchConversations() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

// fetch a single conversation by ID
export async function fetchConversation(conversationId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
}

// client/src/api.js

// Send an agent reply
export async function sendReply(conversationId, text) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/reply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending reply:", error);
    throw error;
  }
}

// ingest a customer's message
export async function ingestMessage(text) {
  try {
    const customerId = getCustomerId();
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Customer-Id": customerId,
      },
      body: JSON.stringify({ text, customerId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error ingesting message:", error);
    throw error;
  }
}

// client/src/api.js

export async function startNewConversation() {
  try {
    const customerId = getCustomerId();

    const response = await fetch(`${API_BASE_URL}/api/conversations/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Customer-Id": customerId,
      },
      body: JSON.stringify({ customerId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    localStorage.removeItem("customerConversationId");

    return data;
  } catch (error) {
    console.error("Error starting new conversation:", error);
    throw error;
  }
}

export async function endConversation(conversationId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/end-customer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error ending conversation:", error);
    throw error;
  }
}

export async function resolveConversation(conversationId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/resolve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error resolving conversation:", error);
    throw error;
  }
}

export async function escalateConversation(conversationId, reason) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/escalate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error ending conversation:", error);
    throw error;
  }
}

export function onNewMessage(socket, callback) {
  socket.on("new_message", callback);
  return () => socket.off("new_message", callback);
}

export function onConversationUpdated(callback) {
  const socket = getAgentSocket();
  socket.on("conversation_updated", callback);
  return () => socket.off("conversation_updated", callback);
}

export function onAgentReply(callback) {
  const socket = getCustomerSocket();
  socket.on("agent_reply", callback);
  return () => socket.off("agent_reply", callback);
}

export function onConversationEnded(callback) {
  const socket = getCustomerSocket();
  socket.on("conversation_ended", callback);
  return () => socket.off("conversation_ended", callback);
}

export function onConversationEscalated(callback) {
  const socket = getCustomerSocket();
  socket.on("conversation_escalated", callback);
  return () => socket.off("conversation_escalated", callback);
}
