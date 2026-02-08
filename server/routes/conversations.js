// server/routes/conversations.js
import express from "express";
import {
  findOrCreateConversation,
  getLastMessagePreview,
  conversations,
  customerSessions,
  saveConversations,
  currentAgentLanguage,
} from "../utils/conversationManager.js";

const router = express.Router();

export default function conversationsRoutes({ io, lingoDotDev }) {
  router.post("/messages", async (req, res) => {
    try {
      const { text, customerId } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Message text is required" });
      }

      const effectiveCustomerId =
        customerId || req.headers["x-customer-id"] || "anonymous";

      const detectedLocale = await lingoDotDev.recognizeLocale(text); // language detection with lingo.dev

      const translationResult = await lingoDotDev.localizeText(text, {
        sourceLocale: detectedLocale,
        targetLocale: currentAgentLanguage,
      });
      const translatedText = translationResult;

      const conversation = findOrCreateConversation(
        effectiveCustomerId,
        detectedLocale,
      );

      if (conversation.status !== "active") {
        return res.status(403).json({
          error: "Conversation is closed",
          status: conversation.status,
        });
      }

      const message = {
        role: "customer",
        original_text: text,
        translated_text: translatedText,
        timestamp: new Date(),
      };

      // update conversation
      conversation.messages.push(message);
      conversation.updatedAt = new Date();

      // save updated conversation
      await saveConversations();

      io.to("agents").emit("new_message", {
        conversationId: conversation.id,
        message,
      });

      io.to("agents").emit("conversation_updated", {
        id: conversation.id,
        language: conversation.language,
        lastMessage: getLastMessagePreview(conversation),
        updatedAt: conversation.updatedAt,
        customerId: conversation.customerId,
      });

      res.json({
        success: true,
        conversationId: conversation.id,
        customerId: effectiveCustomerId,
        message,
      });
    } catch (error) {
      console.error("[Error Processing Message]", error);
      res.status(500).json({
        error: "Failed to process message",
        details: error.message,
      });
    }
  });

  router.get("/conversations", (req, res) => {
    const conversationList = Array.from(conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((conv) => ({
        id: conv.id,
        language: conv.language,
        lastMessage: getLastMessagePreview(conv),
        updatedAt: conv.updatedAt,
        customerId: conv.customerId,
      }));

    res.json(conversationList);
  });

  router.get("/conversations/:id", (req, res) => {
    const conversation = conversations.get(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({
      id: conversation.id,
      customerId: conversation.customerId,
      language: conversation.language,
      messages: conversation.messages,
      status: conversation.status,
    });
  });

  router.post("/conversations/new", (req, res) => {
    const { customerId } = req.body;
    const effectiveCustomerId =
      customerId || req.headers["x-customer-id"] || "anonymous";

    const existingConvId = customerSessions.get(effectiveCustomerId);
    if (existingConvId) {
      customerSessions.delete(effectiveCustomerId);
    }

    res.json({
      success: true,
      message: "Ready for new conversation",
      customerId: effectiveCustomerId,
    });
  });

  router.post("/conversations/:id/reply", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Reply text is required" });
      }

      const conversation = conversations.get(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conversation.status === "resolved") {
        return res.status(403).json({
          error: "Conversation is closed",
          status: conversation.status,
        });
      }

      const translationResult = await lingoDotDev.localizeText(text, {
        sourceLocale: currentAgentLanguage,
        targetLocale: conversation.customerLocale,
      });
      const translatedText = translationResult;

      const message = {
        role: "agent",
        original_text: text,
        translated_text: translatedText,
        timestamp: new Date(),
      };

      conversation.messages.push(message);
      conversation.updatedAt = new Date();

      await saveConversations();

      io.to(`customer-${conversation.customerId}`).emit("agent_reply", {
        conversationId: conversation.id,
        message,
      });

      res.json({
        success: true,
        message,
        translatedForCustomer: translatedText,
      });
    } catch (error) {
      console.error("[Error Processing Reply]", error);
      res.status(500).json({
        error: "Failed to process reply",
        details: error.message,
      });
    }
  });

  // allow customer to end a convesation
  router.post("/conversations/:id/end-customer", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const conversation = conversations.get(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      conversation.status = "resolved"; // use 'resolved' for simplicity. You will want to use an entirely different status for a production app
      conversation.closedAt = new Date();
      conversation.closedBy = "customer";
      conversation.updatedAt = new Date();

      await saveConversations();

      io.to("agents").emit("conversation_ended", {
        conversationId: conversation.id,
        status: conversation.status,
        closedBy: conversation.closedBy,
      });

      res.json({
        success: true,
        status: conversation.status,
      });
    } catch (error) {
      console.error("[Error Ending Conversation]", error);
      res.status(500).json({
        error: "Failed to end conversation",
        details: error.message,
      });
    }
  });

  // allow agents to resolve a conversation
  router.post("/conversations/:id/resolve", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const conversation = conversations.get(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      conversation.status = "resolved";
      conversation.closedAt = new Date();
      conversation.closedBy = "agent";
      conversation.updatedAt = new Date();

      await saveConversations();

      io.to(`customer-${conversation.customerId}`).emit("conversation_ended", {
        conversationId: conversation.id,
        status: conversation.status,
        closedBy: conversation.closedBy,
      });

      res.json({
        success: true,
        status: conversation.status,
      });
    } catch (error) {
      console.error("[Error Resolving Conversation]", error);
      res.status(500).json({
        error: "Failed to resolve conversation",
        details: error.message,
      });
    }
  });

  // allow agents to escalate complex issues
  router.post("/conversations/:id/escalate", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { reason } = req.body;
      const conversation = conversations.get(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      conversation.status = "escalated";
      conversation.escalatedAt = new Date();
      conversation.escalationReason = reason || "";
      conversation.updatedAt = new Date();

      await saveConversations();

      io.to(`customer-${conversation.customerId}`).emit(
        "conversation_escalated",
        {
          conversationId: conversation.id,
          status: conversation.status,
        },
      );

      res.json({
        success: true,
        status: conversation.status,
      });
    } catch (error) {
      console.error("[Error Escalating Conversation]", error);
      res.status(500).json({
        error: "Failed to escalate conversation",
        details: error.message,
      });
    }
  });

  router.get("/agent-language", (req, res) => {
    res.json({ language: currentAgentLanguage });
  });

  return router;
}
