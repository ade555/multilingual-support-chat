import fs from "fs/promises";
import path from "path";

const CONVERSATIONS_FILE = path.join(
  process.cwd(),
  "data",
  "conversations.json",
);

/**
 * Conversation structure:
 * {
 *   id: string,
 *   language: string,        // Customer's detected language code
 *   customerLocale: string,  // Full locale identifier
 *   messages: [
 *     {
 *       role: 'customer' | 'agent',
 *       original_text: string,
 *       translated_text: string,
 *       timestamp: Date
 *     }
 *   ],
 *   status: 'active' | 'resolved' | 'escalated',
 *   createdAt: Date,
 *   updatedAt: Date,
 *   closedAt: Date | null,
 *   closedBy: 'agent' | 'customer' | null
 * }
 */
export const conversations = new Map();
export const customerSessions = new Map();
export let conversationIdCounter = 1;
export let currentAgentLanguage = "en";

export async function loadConversations() {
  try {
    await fs.mkdir(path.dirname(CONVERSATIONS_FILE), { recursive: true });
    const data = await fs.readFile(CONVERSATIONS_FILE, "utf-8");
    const saved = JSON.parse(data);

    saved.conversations.forEach((conv) => {
      conv.createdAt = new Date(conv.createdAt);
      conv.updatedAt = new Date(conv.updatedAt);
      conv.messages.forEach((msg) => {
        msg.timestamp = new Date(msg.timestamp);
      });
      conversations.set(conv.id, conv);
    });

    Object.entries(saved.customerSessions).forEach(([customerId, convId]) => {
      customerSessions.set(customerId, convId);
    });

    if (saved.conversationIdCounter) {
      conversationIdCounter = saved.conversationIdCounter;
    }

    console.log(
      `[Persistence] Loaded ${conversations.size} conversations from disk`,
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("[Persistence] No saved conversations found, starting fresh");
    } else {
      console.error("[Persistence] Error loading conversations:", error);
    }
  }
}

export async function saveConversations() {
  try {
    const data = {
      conversations: Array.from(conversations.values()),
      customerSessions: Object.fromEntries(customerSessions),
      conversationIdCounter: conversationIdCounter,
      savedAt: new Date().toISOString(),
    };

    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(data, null, 2));
    console.log(
      `[Persistence] Saved ${conversations.size} conversations to disk`,
    );
  } catch (error) {
    console.error("[Persistence] Error saving conversations:", error);
  }
}

export function findOrCreateConversation(customerId, detectedLocale) {
  const existingConvId = customerSessions.get(customerId);
  if (existingConvId && conversations.has(existingConvId)) {
    return conversations.get(existingConvId);
  }

  const id = `conv_${conversationIdCounter++}`;
  const languageCode = detectedLocale.split("-")[0];

  const conversation = {
    id,
    customerId,
    language: languageCode,
    customerLocale: detectedLocale,
    messages: [],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    closedAt: null,
    closedBy: null,
  };

  conversations.set(id, conversation);
  customerSessions.set(customerId, id);
  return conversation;
}

export function getLastMessagePreview(conversation) {
  if (conversation.messages.length === 0) return "";
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  return lastMessage.translated_text.substring(0, 80);
}

export function setAgentLanguage(language) {
  currentAgentLanguage = language;
  console.log("[Agent Language Updated]", currentAgentLanguage);
}
