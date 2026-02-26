import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";

export default function AmazonConnectWebchatClone({ startChatUrl, user }) {
    const chatSessionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("connect_messages")) || [];
        } catch {
            return [];
        }
    });
    const [typing, setTyping] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

    // Reliable scroll to bottom using container ref
    const scrollToBottom = useCallback(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight - container.clientHeight;
        }
    }, []);

    // Auto-scroll on new messages + connection events
    useLayoutEffect(() => {
        if (shouldScrollToBottom && messagesContainerRef.current) {
            scrollToBottom();
        }
    }, [messages, shouldScrollToBottom, scrollToBottom]);

    // Detect when user manually scrolls (don't auto-scroll)
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        
        const isAtBottom = 
            Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5;
        setShouldScrollToBottom(isAtBottom);
    }, []);

    // Persistent IDs (like Cognigy)
    const userId = user?.id ||
        localStorage.getItem("connect_userId") ||
        `guest-${Math.random().toString(36).slice(2)}`;

    const sessionId = localStorage.getItem("connect_sessionId") ||
        `sess-${Math.random().toString(36).slice(2)}`;

    useEffect(() => {
        localStorage.setItem("connect_userId", userId);
        localStorage.setItem("connect_sessionId", sessionId);
    }, [userId, sessionId]);

    const getChatDetails = useCallback(async () => {
        const res = await fetch(startChatUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId, sessionId,
                displayName: user?.name || userId,
                metadata: user?.metadata || {}
            })
        });

        if (!res.ok) throw new Error(`API failed: ${res.status}`);

        const apiGwPayload = await res.json();
        return JSON.parse(apiGwPayload.body);
    }, [startChatUrl, userId, sessionId, user]);

    const initChat = useCallback(async () => {
        if (chatSessionRef.current) {
            console.log("Chat session already exists");
            return;
        }

        try {
            setInitializing(true);

            const chatBody = await getChatDetails();
            console.log("✅ Chat details:", chatBody.contactId);

            const customerChatSession = window.connect.ChatSession.create({
                chatDetails: {
                    ContactId: chatBody.contactId,
                    ParticipantId: chatBody.participantId,
                    ParticipantToken: chatBody.participantToken
                },
                type: "CUSTOMER",
                options: {
                    region: "ap-southeast-1"
                }
            });

            chatSessionRef.current = customerChatSession;

            // Message deduplication cache
            const messageCache = new Map();

            customerChatSession.onMessage((event) => {
                console.log("📥 Raw event:", {
                    role: event.data.ParticipantRole,
                    content: event.data.Content?.slice(0, 50),
                    type: event.data.ContentType,
                    id: event.data.Id
                });

                // BLOCK OWN MESSAGE ECHOES ONLY
                if (event.data.ParticipantRole === "CUSTOMER" &&
                    event.data.ContentType === "text/plain") {
                    console.log("⏭️ Blocked own message echo");
                    return;
                }

                // Deduplicate agent messages
                if (event.data.ContentType === "text/plain") {
                    const contentHash = btoa(event.data.Content || '').slice(0, 20);
                    const msgKey = `${event.data.ContactId}-${event.data.Id}-${contentHash}`;

                    if (messageCache.has(msgKey)) {
                        console.log("⏭️ Duplicate skipped");
                        return;
                    }
                    messageCache.set(msgKey, Date.now());
                }

                const msg = {
                    id: Date.now() + Math.random(),
                    from: event.data.ParticipantRole === "CUSTOMER" ? "user" : "agent",
                    text: event.data.Content || `[${event.data.ContentType || 'system'}]`
                };

                console.log(`📨 ${msg.from}:`, msg.text.slice(0, 50));

                setMessages(prev => {
                    const updated = [...prev, msg];
                    localStorage.setItem("connect_messages", JSON.stringify(updated));
                    return updated;
                });
            });

            customerChatSession.onTyping(() => {
                setTyping(true);
                setTimeout(() => setTyping(false), 2000);
            });

            customerChatSession.onConnectionEstablished(() => {
                console.log("✅ Chat connected");
                setConnected(true);
                setInitializing(false);
                setShouldScrollToBottom(true);
                setTimeout(scrollToBottom, 100);
            });

            customerChatSession.onEnded(() => {
                console.log("🔚 Chat ended");
                setConnected(false);
                chatSessionRef.current = null;
            });

            customerChatSession.onConnectionBroken(() => {
                console.log("🔌 Connection broken");
                setConnected(false);
            });

            await customerChatSession.connect();
        } catch (error) {
            console.error("❌ Chat initialization failed:", error);
            setInitializing(false);
        }
    }, [getChatDetails, scrollToBottom]);

    const sendText = useCallback((text) => {
        if (!chatSessionRef.current || !connected) {
            console.log("Cannot send: not connected");
            return;
        }

        try {
            // Optimistic UI update
            const userMsg = {
                id: Date.now() + Math.random(),
                from: "user",
                text: text.trim()
            };

            setMessages(prev => {
                const updated = [...prev, userMsg];
                localStorage.setItem("connect_messages", JSON.stringify(updated));
                return updated;
            });

            // Send via ChatJS
            chatSessionRef.current.sendMessage({
                contentType: "text/plain",
                message: text.trim()
            }).catch(e => console.error("Send failed:", e));
        } catch (error) {
            console.error("Send error:", error);
        }
    }, [connected]);

    useEffect(() => {
        initChat();

        return () => {
            if (chatSessionRef.current) {
                chatSessionRef.current.disconnectParticipant().catch(console.error);
                chatSessionRef.current = null;
            }
        };
    }, [initChat]);

    return React.createElement(
        "div",
        { style: styles.container },
        React.createElement(
            "div",
            { style: styles.header },
            `Chat ${initializing ? "⏳" : connected ? "🟢" : "🔴"}`
        ),
        React.createElement(
            "div", 
            { 
                ref: messagesContainerRef,
                style: {
                    ...styles.messages,
                    overflowY: "auto"
                },
                onScroll: handleScroll
            },
            messages.map((m) =>
                React.createElement(
                    "div",
                    {
                        key: m.id,
                        style: {
                            margin: "8px 0",
                            textAlign: m.from === "user" ? "right" : "left",
                            opacity: initializing ? 0.5 : 1
                        }
                    },
                    React.createElement(
                        "div",
                        {
                            style: {
                                ...styles.bubble,
                                background: m.from === "user" ? "#dbeafe" : "#fff",
                                maxWidth: "80%"
                            }
                        },
                        m.text
                    )
                )
            ),
            React.createElement("div", { 
                ref: messagesEndRef, 
                style: { height: 0 } 
            }),
            typing &&
                React.createElement(
                    "div",
                    { style: styles.typing },
                    "Agent is typing..."
                )
        ),
        React.createElement(ChatInput, {
            onSend: sendText,
            connected: connected && !initializing,
            disabled: initializing
        })
    );
}

function ChatInput({ onSend, connected, disabled }) {
    const [value, setValue] = useState("");

    const handleSubmit = () => {
        if (value.trim() && connected) {
            onSend(value.trim());
            setValue("");
        }
    };

    return React.createElement(
        "div",
        { style: styles.inputRow },
        React.createElement("input", {
            value,
            disabled: !connected || disabled,
            placeholder: connected ? "Type a message..." : "Connecting...",
            style: {
                ...styles.input,
                opacity: disabled ? 0.5 : 1
            },
            onChange: (e) => setValue(e.target.value),
            onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey && value.trim()) {
                    e.preventDefault();
                    handleSubmit();
                }
            }
        }),
        React.createElement(
            "button",
            {
                disabled: !connected || disabled,
                onClick: handleSubmit,
                style: {
                    ...styles.sendButton,
                    background: connected ? "#007bff" : "#ccc",
                    cursor: connected ? "pointer" : "not-allowed"
                }
            },
            "Send"
        )
    );
}

const styles = {
    container: {
        width: 360,
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 8,
        fontFamily: "sans-serif",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    header: {
        fontWeight: "bold",
        paddingBottom: 8,
        borderBottom: "1px solid #eee",
        fontSize: 14
    },
    messages: {
        height: 320,
        overflowY: "auto",
        padding: 8,
        background: "#fafafa",
        marginTop: 8,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column"
    },
    bubble: {
        display: "inline-block",
        padding: "10px 14px",
        borderRadius: "18px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        wordWrap: "break-word"
    },
    typing: {
        fontStyle: "italic",
        color: "#666",
        padding: "8px 12px",
        fontSize: 14
    },
    inputRow: {
        display: "flex",
        gap: 8,
        marginTop: 8
    },
    input: {
        flex: 1,
        padding: "10px 12px",
        borderRadius: 6,
        border: "1px solid #ddd",
        outline: "none",
        fontSize: 14
    },
    sendButton: {
        padding: "10px 16px",
        color: "white",
        border: "none",
        borderRadius: 6,
        fontWeight: 500
    }
};
