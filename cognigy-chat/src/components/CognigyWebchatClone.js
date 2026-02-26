import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SocketClient } from "@cognigy/socket-client";
import Grid from "@cloudscape-design/components/grid";

// Cloudscape
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";

/**
 * Props:
 * - endpointUrl: Cognigy endpoint base URL
 * - urlToken: Cognigy URLToken
 * - user: { id, name, locale, metadata }
 *
 * Notes:
 * - Switches from Cognigy ("chat") to Amazon Connect ("handover_pending" -> "agent")
 * - Keeps input enabled during handover and queues user messages until Connect is ready.
 * - AUTO-RETURNS to Cognigy when agent disconnects/ends (so post-disconnect user messages go to Cognigy).
 * - Builds the transcript payload from a live messagesRef (so transcript is never stale).
 * - Embeds a "page" (iframe) when Cognigy sends payload.data.data.voice.url (or payload.data.voice.url).
 */
export default function CognigyWebchatClone({ endpointUrl, urlToken, user }) {
  const clientRef = useRef(null);

  // Amazon Connect
  const startChatUrl =process.env.REACT_APP_STARTCHATURL;
  const connectSessionRef = useRef(null);
  const [agentConnected, setAgentConnected] = useState(false);
  const connectInitStartedRef = useRef(false);
  const queuedRef = useRef([]);

  // If you still want these to pass along, keep them:
  const [sentiment, setSentiment] = useState(null);
  const [reason, setReason] = useState(null);

  // Embedded page mode (URL sent from Cognigy)
  const [embeddedUrl, setEmbeddedUrl] = useState(null);
  const [embedError, setEmbedError] = useState(null);

  // --- autoscroll refs/state ---
  const messagesContainerRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom =
      Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5;

    setShouldScrollToBottom(isAtBottom);
  }, []);

  // modes: "chat" | "handover_pending" | "agent"
  const [mode, setMode] = useState("chat");
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [connected, setConnected] = useState(false);

  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cognigy_messages")) || [];
    } catch {
      return [];
    }
  });

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      messagesRef.current = updated;
      localStorage.setItem("cognigy_messages", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const [typing, setTyping] = useState(false);

  // persistent IDs so the session resumes
  const userId =
    (user && user.id) ||
    localStorage.getItem("cognigy_userId") ||
    `guest-${Math.random().toString(36).slice(2)}`;

  const sessionId =
    localStorage.getItem("cognigy_sessionId") ||
    `sess-${Math.random().toString(36).slice(2)}`;

  useEffect(() => {
    localStorage.setItem("cognigy_userId", userId);
    localStorage.setItem("cognigy_sessionId", sessionId);
  }, [userId, sessionId]);

  // Auto-scroll on new messages (only if user is at bottom)
  useLayoutEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      scrollToBottom();
    }
  }, [messages, shouldScrollToBottom, scrollToBottom]);

  // Auto-scroll when typing appears
  useLayoutEffect(() => {
    if (typing && shouldScrollToBottom && messagesContainerRef.current) {
      scrollToBottom();
    }
  }, [typing, shouldScrollToBottom, scrollToBottom]);

  function shouldDisplayBotPayload(p) {
    if (!p) return false;

    if (typeof p.text === "string" && p.text.trim()) return true;
    if (p.data?.cards?.length) return true;
    if (p.attachment?.url) return true;

    if (p.data?._cognigy) return false;
    return false;
  }

  function extractEmbedUrl(payload) {
    const url1 = payload?.data?.data?.voice?.url;
    const url2 = payload?.data?.voice?.url;
    return url1 || url2 || null;
  }

  // --- Cognigy Socket.IO ---
  useEffect(() => {
    let disposed = false;

    const client = new SocketClient(endpointUrl.replace(/\/$/, ""), urlToken, {
      userId,
      sessionId,
      channel: "webchat-clone",
      reconnection: true,
      enableInnerSocketHandshake: false
    });

    client.on("output", (payload) => {
      const entries = Array.isArray(payload) ? payload : [payload];

      // 1) Embedded page
      for (const p of entries) {
        const url = extractEmbedUrl(p);
        if (url) {
          setEmbedError(null);
          setEmbeddedUrl(url);

          if (p?.text) {
            appendMessage({
              id: Date.now() + Math.random(),
              from: "bot",
              payload: p
            });
          }
          return;
        }
      }

      // 2) Detect handover safely
      const isHandover = entries.some((e) => {
        if (e?.data?.handover === true) {
          // You can store these if Cognigy sends them:
          setSentiment(e?.data?.attributes?.sentiment ?? null);
          setReason(e?.data?.attributes?.reason ?? null);
          return true;
        }
        return false;
      });

      if (isHandover) {
        setMode("handover_pending");
        modeRef.current = "handover_pending";
        return;
      }

      // 3) If not in bot mode, ignore Cognigy bot messages
      if (modeRef.current !== "chat") return;

      const nextMessages = entries
        .filter(shouldDisplayBotPayload)
        .map((p) => ({
          id: Date.now() + Math.random(),
          from: "bot",
          payload: p
        }));

      if (!nextMessages.length) return;

      for (const msg of nextMessages) appendMessage(msg);
    });

    client.on("typingStatus", (status) => {
      setTyping(status === "on");
    });

    client.on("error", (err) => {
      console.error("Cognigy socket error:", err);
    });

    (async () => {
      try {
        await client.connect();
        if (!disposed) {
          setConnected(true);
          setShouldScrollToBottom(true);

          // Optional invisible session_start
          try {
            client.sendMessage("", { metadata: { event: "session_start" } });
          } catch {}

          setTimeout(scrollToBottom, 0);
        }
      } catch (e) {
        console.error("Cognigy connect failed:", e);
        if (!disposed) setConnected(false);
      }
    })();

    clientRef.current = client;

    return () => {
      disposed = true;
      setConnected(false);
      try {
        client.disconnect();
      } catch {}
    };
  }, [endpointUrl, urlToken, userId, sessionId, scrollToBottom, appendMessage]);

  // --- Amazon Connect init ---
  const initConnectChat = useCallback(
    async (chatBody) => {
      if (connectSessionRef.current) return;

      if (!window.connect?.ChatSession?.create) {
        throw new Error(
          "Amazon Connect ChatJS not found. Ensure the Connect ChatJS script is loaded (window.connect.ChatSession.create)."
        );
      }

      const session = window.connect.ChatSession.create({
        chatDetails: {
          ContactId: chatBody.contactId,
          ParticipantId: chatBody.participantId,
          ParticipantToken: chatBody.participantToken
        },
        type: "CUSTOMER",
        options: { region: process.env.REACT_APP_AWSREGION}
      });

      connectSessionRef.current = session;

      // Helper: return to Cognigy automatically
      const autoReturnToCognigy = (whyText) => {
        // Close out connect state
        setAgentConnected(false);
        connectSessionRef.current = null;
        connectInitStartedRef.current = false;
        queuedRef.current = [];

        // Optional system message
        if (whyText) {
          appendMessage({
            id: Date.now() + Math.random(),
            from: "system",
            text: whyText
          });
        }

        // ✅ Switch back to Cognigy mode so post-disconnect user messages go to Cognigy
        setMode("chat");
        modeRef.current = "chat";

        setShouldScrollToBottom(true);
        setTimeout(scrollToBottom, 0);
      };

      session.onMessage((event) => {
        const role = event?.data?.ParticipantRole;
        const contentType = event?.data?.ContentType;
        const content = event?.data?.Content || "";

        // Detect disconnect text and auto return
        if (role === "SYSTEM" && contentType === "text/plain") {
          const lower = (content || "").toLowerCase();
          if (lower.includes("the agent has disconnected")) {
            autoReturnToCognigy(content);
            return;
          }
          if (lower.includes("agent ended the chat")) {
            autoReturnToCognigy(content);
            return;
          }
        }

        // Ignore echo of customer text
        if (role === "CUSTOMER" && contentType === "text/plain") return;

        // Ignore internal connect events
        if (
          typeof contentType === "string" &&
          contentType.startsWith("application/vnd.amazonaws.connect.event.")
        ) {
          return;
        }

        const from =
          role === "AGENT" ? "agent" : role === "SYSTEM" ? "system" : "user";

        const text =
          contentType === "text/plain"
            ? content
            : content || `[${contentType || "system"}]`;

        appendMessage({ id: Date.now() + Math.random(), from, text });
      });

      session.onTyping(() => {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      });

      session.onConnectionEstablished(() => {
        setAgentConnected(true);
        setMode("agent");
        modeRef.current = "agent";
        setShouldScrollToBottom(true);
        setTimeout(scrollToBottom, 0);
      });

      session.onEnded(() => {
        // ✅ Auto return to Cognigy when Connect ends
        setAgentConnected(false);
        connectSessionRef.current = null;
        connectInitStartedRef.current = false;

        appendMessage({
          id: Date.now() + Math.random(),
          from: "system",
          text: "Agent ended the chat."
        });

        setMode("chat");
        modeRef.current = "chat";

        setShouldScrollToBottom(true);
        setTimeout(scrollToBottom, 0);
      });

      session.onConnectionBroken(() => {
        // Connection broken is ambiguous; you can choose to auto-return or not.
        // Here we do NOT force mode changes; Connect may reconnect.
        setAgentConnected(false);
      });

      await session.connect();

      // Flush queued messages
      if (queuedRef.current.length) {
        const toSend = [...queuedRef.current];
        queuedRef.current = [];
        for (const t of toSend) {
          session
            .sendMessage({ contentType: "text/plain", message: t })
            .catch((e) => console.error("Failed to send queued message:", e));
        }
      }
    },
    [scrollToBottom, appendMessage]
  );

  // Call API Gateway when handover starts, then create Connect ChatSession
  useEffect(() => {
    if (mode !== "handover_pending") return;
    if (connectInitStartedRef.current) return;
    connectInitStartedRef.current = true;

    (async () => {
      try {
        const res = await fetch(startChatUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            sessionId,
            displayName: user?.name || userId,
            metadata: {
              // ✅ Always send the latest full message list (never stale)
              transcript: JSON.stringify(messagesRef.current || []),
              sentiment: sentiment ?? null,
              reason: reason ?? null
            }
          })
        });

        if (!res.ok) throw new Error(`startChatUrl failed: ${res.status}`);

        const apiGwPayload = await res.json();
        const chatBody =
          typeof apiGwPayload.body === "string"
            ? JSON.parse(apiGwPayload.body)
            : apiGwPayload;

        await initConnectChat(chatBody);
      } catch (e) {
        console.error("❌ Failed to start handover:", e);
        connectInitStartedRef.current = false;

        // If connect start fails, fall back to Cognigy chat mode
        setMode("chat");
        modeRef.current = "chat";
      }
    })();
  }, [mode, startChatUrl, userId, sessionId, user, initConnectChat, sentiment, reason]);

  // --- RETURN TO COGNIGY handler (manual) ---
  const returnToCognigy = useCallback(async () => {
    const session = connectSessionRef.current;
    if (session) {
      try {
        if (typeof session.disconnectParticipant === "function") {
          await session.disconnectParticipant();
        } else if (typeof session.disconnect === "function") {
          await session.disconnect();
        }
      } catch (e) {
        console.warn("Failed to disconnect Connect session:", e);
      }
    }

    connectSessionRef.current = null;
    setAgentConnected(false);
    connectInitStartedRef.current = false;
    queuedRef.current = [];

    appendMessage({
      id: Date.now() + Math.random(),
      from: "system",
      text: "You returned to Cognigy."
    });

    setMode("chat");
    modeRef.current = "chat";
    setShouldScrollToBottom(true);
    setTimeout(scrollToBottom, 0);
  }, [scrollToBottom, appendMessage]);

  function sendText(text) {
    if (!connected) return;

    const trimmed = (text || "").trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now() + Math.random(), from: "user", text: trimmed };

    setShouldScrollToBottom(true);
    appendMessage(userMsg);
    setTimeout(scrollToBottom, 0);

    // ----------------------------
    // ROUTING LOGIC
    // ----------------------------
    if (modeRef.current === "chat") {
      if (!clientRef.current) return;
      clientRef.current.sendMessage(trimmed, { metadata: (user && user.metadata) || {} });
      return;
    }

    // While starting Connect, queue the message
    if (modeRef.current === "handover_pending") {
      queuedRef.current.push(trimmed);
      return;
    }

    // Normal agent flow: send to Connect if ready, otherwise queue
    if (modeRef.current === "agent") {
      const session = connectSessionRef.current;
      if (!session || !agentConnected) {
        queuedRef.current.push(trimmed);
        return;
      }
      session
        .sendMessage({ contentType: "text/plain", message: trimmed })
        .catch((e) => console.error("Connect send failed:", e));
    }
  }

  function renderBotPayload(payload) {
    if (!payload) return null;
    if (payload.text) {
      return <div dangerouslySetInnerHTML={{ __html: payload.text }} />;
    }
    return null;
  }

  const renderMessageContent = (m) => {
    if (m.payload) return renderBotPayload(m.payload);
    return m.text ?? "";
  };

  const inputEnabled = connected;
  const queuedCount = queuedRef.current.length;

  // Save transcript
  const handleSaveTranscript = useCallback(() => {
    const current = messagesRef.current || [];
    if (!current.length) return;

    const lines = current.map((m) => {
      const who =
        m.from === "user"
          ? "You"
          : m.from === "agent"
            ? "Agent"
            : m.from === "bot"
              ? "Bot"
              : "System";

      const time = new Date(m.id).toLocaleString();
      const content =
        (m.payload?.text ?? m.text) || JSON.stringify(m.payload ?? {}, null, 2);

      return `[${time}] ${who}: ${content}`;
    });

    const blob = new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-transcript-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // ✅ Embedded mode
  if (embeddedUrl) {
    return (
      <Container
        header={
          <Header
            variant="h3"
            actions={
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={() => setEmbeddedUrl(null)}>Back to chat</Button>
                <Button
                  iconName="download"
                  variant="icon"
                  ariaLabel="Save chat transcript"
                  onClick={handleSaveTranscript}
                />
              </div>
            }
          >
            Embedded page
          </Header>
        }
      >
        {embedError && (
          <div style={{ marginBottom: 8, padding: 10, background: "#fff7d6", borderRadius: 6 }}>
            {embedError}
          </div>
        )}

        <iframe
          src={embeddedUrl}
          title="Embedded page"
          style={{
            width: "100%",
            height: 600,
            border: "none",
            borderRadius: 8
          }}
          allow="camera; microphone; autoplay"
          onLoad={() => setEmbedError(null)}
          onError={() =>
            setEmbedError(
              "This page refused to load inside the app (likely X-Frame-Options / CSP frame-ancestors). If it’s your page, allow embedding. Otherwise you’ll need to open it in a new tab."
            )
          }
        />
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                iconName="download"
                variant="icon"
                ariaLabel="Save chat transcript"
                onClick={handleSaveTranscript}
              />

              {/* Optional manual return button if you ever want it visible */}
              {mode !== "chat" ? (
                <Button onClick={returnToCognigy}>Return to Cognigy</Button>
              ) : null}
            </div>
          }
        >
          {`Chat (${mode})${queuedCount ? ` • queued: ${queuedCount}` : ""}`}
        </Header>
      }
    >
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          height: 320,
          overflowY: "auto",
          padding: 8,
          background: "#fafafa",
          borderRadius: 6
        }}
      >
        {messages.map((m) => {
          const isUser = m.from === "user";

          // Bubble colors (adjust however you want)
          const bg =
            m.from === "user"
              ? "#ffffff"
              : m.from === "bot"
                ? "#e6f2ff"
                : m.from === "agent"
                  ? "#dcfce7"
                  : "#c7d2fe"; // system

          const color =
            m.from === "system" ? "#1e1b4b" : "#111827";

          const border =
            m.from === "user" ? "1px solid #e5e7eb" : "none";

          // Left: bot/system/agent, Right: user
          const alignLeft = m.from !== "user";

          return (
            <div
              key={m.id}
              style={{
                margin: "8px 0",
                textAlign: alignLeft ? "left" : "right"
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 16,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  maxWidth: "85%",
                  wordBreak: "break-word",
                  background: bg,
                  color,
                  border,
                  fontStyle: m.from === "system" ? "italic" : "normal"
                }}
              >
                {renderMessageContent(m)}
              </div>
            </div>
          );
        })}

        {typing && (
          <div style={{ fontStyle: "italic", color: "#666", marginTop: 6 }}>
            {mode === "chat" ? "Bot is typing…" : "Agent is typing…"}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <ChatInput onSend={sendText} connected={inputEnabled} />
      </div>
    </Container>
  );
}

/**
 * ChatInput
 * - Enter sends (form submit)
 * - Cloudscape Grid keeps input + icon button aligned on one line
 */
function ChatInput({ onSend, connected }) {
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const canSend = connected && trimmed.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}
    >
      <Grid
        gridDefinition={[
          { colspan: 10 }, // input takes most space
          { colspan: 2 } // button column
        ]}
        alignItems="center"
      >
        <Input
          value={value}
          onChange={({ detail }) => setValue(detail.value)}
          disabled={!connected}
          placeholder={connected ? "Type a message…" : "Connecting…"}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            minWidth: 44
          }}
        >
          <Button
            variant="primary"
            iconName="send"
            ariaLabel="Send message"
            disabled={!canSend}
            onClick={handleSend}
          />
        </div>
      </Grid>

      <button type="submit" style={{ display: "none" }} aria-hidden="true" />
    </form>
  );
}
