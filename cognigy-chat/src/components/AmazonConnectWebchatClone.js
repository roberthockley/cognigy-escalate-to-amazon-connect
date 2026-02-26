// src/components/AmazonConnectWebchatClone.js
import React, { useEffect, useRef, useState } from "react";

/**
 * Props:
 * - startChatUrl: your backend URL that calls StartChatContact and returns
 *   { ContactId, ParticipantId, ParticipantToken, websocketUrl? } etc.
 * - user: { id, name, locale, metadata }
 */
export default function AmazonConnectWebchatClone({ startChatUrl, user }) {
  const chatSessionRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("connect_messages")) || [];
    } catch {
      return [];
    }
  });
  const [typing, setTyping] = useState(false);

  // Stable IDs (similar to Cognigy)
  const userId =
    (user && user.id) ||
    localStorage.getItem("connect_userId") ||
    `guest-${Math.random().toString(36).slice(2)}`;

  const sessionId =
    localStorage.getItem("connect_sessionId") ||
    `sess-${Math.random().toString(36).slice(2)}`;

  useEffect(() => {
    localStorage.setItem("connect_userId", userId);
    localStorage.setItem("connect_sessionId", sessionId);
  }, [userId, sessionId]);

useEffect(() => {
  let cancelled = false;
  let hasInitialized = false;
  const messageCache = new Map();

  async function initChat() {
    if (hasInitialized || cancelled || chatSessionRef.current) {
      console.log("Chat already initialized, skipping");
      return;
    }
    hasInitialized = true;

    try {
      const res = await fetch(startChatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, sessionId,
          displayName: (user && user.name) || userId,
          metadata: (user && user.metadata) || {}
        })
      });

      if (!res.ok) throw new Error(`startChat failed: ${res.status}`);
      
      const apiGwPayload = await res.json();
      const chatBody = JSON.parse(apiGwPayload.body);

      const customerChatSession = window.connect.ChatSession.create({
        chatDetails: {
          ContactId: chatBody.contactId,
          ParticipantId: chatBody.participantId,
          ParticipantToken: chatBody.participantToken
        },
        type: "CUSTOMER",
        options: { region: "ap-southeast-1" }
      });

      chatSessionRef.current = customerChatSession;

      customerChatSession.onMessage((event) => {
        const contentHash = btoa(event.data.Content || '').slice(0, 16);
        const msgKey = `${event.data.ContactId}-${event.data.Id}-${event.data.AbsoluteTime}-${contentHash}`;
        
        if (messageCache.has(msgKey)) {
          console.log("⏭️ Duplicate skipped:", event.data.Content?.slice(0, 30));
          return;
        }
        messageCache.set(msgKey, Date.now());

        if (messageCache.size > 100) {
          const now = Date.now();
          for (const [key, timestamp] of messageCache) {
            if (now - timestamp > 30000) messageCache.delete(key);
          }
        }

        const from = event.data.ParticipantRole === "CUSTOMER" ? "user" : "bot";
        const msg = { 
          id: Date.now() + Math.random(), 
          from, 
          text: event.data.Content || '[non-text]'
        };

        setMessages(prev => {
          const updated = [...prev, msg];
          localStorage.setItem("connect_messages", JSON.stringify(updated));
          return updated;
        });
      });

      customerChatSession.onTyping(() => {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      });

      customerChatSession.onConnectionEstablished(() => {
        setConnected(true);
        console.log("✅ Single chat connected");
      });

      customerChatSession.onEnded(() => {
        setConnected(false);
        chatSessionRef.current = null;
      });

      customerChatSession.onConnectionBroken(() => {
        setConnected(false);
        chatSessionRef.current = null;
      });

      await customerChatSession.connect();
    } catch (e) {
      console.error("❌ Chat init failed:", e);
      hasInitialized = false;
    }
  }

  initChat();

  return () => {
    cancelled = true;
    if (chatSessionRef.current) {
      chatSessionRef.current.disconnectParticipant();
      chatSessionRef.current = null;
    }
  };
}, []); // Single execution



  async function sendText(text) {
    if (!chatSessionRef.current) return;

    try {
      // Amazon Connect uses contentType + message.[web:9][web:18]
      await chatSessionRef.current.sendMessage({
        contentType: "text/plain",
        message: text
      });

      const userMsg = {
        id: Date.now() + Math.random(),
        from: "user",
        text
      };

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        localStorage.setItem("connect_messages", JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Send text failed:", e);
    }
  }

  // Amazon Connect chat messages are plain text (plus rich content via ContentType),
  // so we can simplify compared to Cognigy payloads.[web:16][web:18]
  function renderBotPayload(message) {
    if (!message) return null;
    if (message.text) {
      return <div>{message.text}</div>;
    }
    if (typeof message === "string") {
      return <div>{message}</div>;
    }
    return (
      <pre>{JSON.stringify(message, null, 2)}</pre>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>Chat (Amazon Connect webchat clone)</div>
      <div style={styles.messages}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              margin: "8px 0",
              textAlign: m.from === "user" ? "right" : "left"
            }}
          >
            <div
              style={{
                ...styles.bubble,
                background: m.from === "user" ? "#dbeafe" : "#fff"
              }}
            >
              {m.from === "user" ? m.text : renderBotPayload({ text: m.text })}
            </div>
          </div>
        ))}
        {typing && (
          <div style={styles.typing}>Agent/bot is typing…</div>
        )}
      </div>
      <ChatInput onSend={sendText} connected={connected} />
    </div>
  );
}

function ChatInput({ onSend, connected }) {
  const [value, setValue] = useState("");

  return (
    <div style={styles.inputRow}>
      <input
        value={value}
        disabled={!connected}
        placeholder={connected ? "Type a message…" : "Connecting…"}
        style={styles.input}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onSend(value.trim());
            setValue("");
          }
        }}
      />
      <button
        disabled={!connected}
        onClick={() => {
          if (value.trim()) {
            onSend(value.trim());
            setValue("");
          }
        }}
      >
        Send
      </button>
    </div>
  );
}

const styles = {
  container: {
    width: 360,
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 8,
    fontFamily: "sans-serif"
  },
  header: { fontWeight: "bold" },
  messages: {
    height: 320,
    overflowY: "auto",
    padding: 8,
    background: "#fafafa",
    marginTop: 8
  },
  bubble: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
  },
  typing: { fontStyle: "italic", color: "#666" },
  inputRow: { display: "flex", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc"
  }
};

