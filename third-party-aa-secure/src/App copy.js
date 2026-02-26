// src/App.js
import React, { useState, useMemo, useRef, useEffect } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import Icon from "@cloudscape-design/components/icon";
import FormField from "@cloudscape-design/components/form-field";
const demoTranscript = [
    {
        "speaker": "Sophie",
        "message": "Welcome to Standard Chartered Bank, how can I help you today?"
    },
    {
        "speaker": "Geoffrey",
        "message": "i want to waive my fee"
    },
    {
        "speaker": "Sophie",
        "message": "To continue we have to verify you. Please enter the one time pin send to your mobile phone."
    },
    {
        "speaker": "Geoffrey",
        "message": "1234"
    }
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function App() {
  // Use demoTranscript by default; replace with your transcript array if needed
  const [messages] = useState(demoTranscript);
  const [query, setQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
    const [transcript, setTranscript] = useState(demoTranscript);
    const [summary, setSummary] = useState([]);
    const [sentiment, setSentiment] = useState(null);
    const [error, setError] = useState(null);
    const [value, setValue] = React.useState("");
  const itemRefs = useRef(new Map());
  const containerRef = useRef(null);

  // Build matches: [{ messageIndex, start, end, text }]
  const matches = useMemo(() => {
    if (!query || query.trim() === "") return [];
    const q = query.trim();
    const regex = new RegExp(escapeRegExp(q), "gi");
    const found = [];
    messages.forEach((m, i) => {
      let match;
      while ((match = regex.exec(m.message)) !== null) {
        found.push({
          messageIndex: i,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        // avoid zero-length infinite loops
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }
    });
    return found;
  }, [messages, query]);

  // Reset to first match when query/matches change
  useEffect(() => {
    setCurrentMatchIdx(matches.length > 0 ? 0 : 0);
  }, [matches.length]);

  // Scroll (smooth) to current match's message container and flash it
  useEffect(() => {
    if (matches.length === 0) return;
    const match = matches[(currentMatchIdx % matches.length + matches.length) % matches.length];
    if (!match) return;
    const node = itemRefs.current.get(match.messageIndex);
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      // temporary highlight (by inline style)
      const original = node.style.boxShadow;
      node.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.25)"; // soft indigo glow
      setTimeout(() => {
        node.style.boxShadow = original;
      }, 800);
    }
  }, [currentMatchIdx, matches]);

  function goNext() {
    if (matches.length === 0) return;
    setCurrentMatchIdx((prev) => (prev + 1) % matches.length);
  }
  function goPrev() {
    if (matches.length === 0) return;
    setCurrentMatchIdx((prev) => (prev - 1 + matches.length) % matches.length);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      // When focus is on an input, still allow these keys for convenience:
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [matches.length]);

  // Render a message with highlighted occurrences
  function renderHighlightedText(text, q) {
    if (!q) return text;
    const parts = [];
    const regex = new RegExp(escapeRegExp(q), "gi");
    let lastIndex = 0;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = regex.lastIndex;
      if (start > lastIndex) {
        parts.push(<span key={`${idx}-a`}>{text.slice(lastIndex, start)}</span>);
      }
      parts.push(
        <mark
          key={`${idx}-b`}
          style={{
            backgroundColor: "#fff68f",
            padding: "0 2px",
            borderRadius: 3
          }}
        >
          {text.slice(start, end)}
        </mark>
      );
      lastIndex = end;
      idx++;
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={`${idx}-c`}>{text.slice(lastIndex)}</span>);
    }
    return parts;
  }

  // UI styles (simple)
  const styles = {
    app: { fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", padding: 18, maxWidth: 900, margin: "0 auto" },
    controls: { display: "flex", gap: 8, alignItems: "center", marginBottom: 12 },
    input: { flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", outline: "none" },
    btn: { padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" },
    meta: { fontSize: 13, color: "#6b7280" },
    list: { maxHeight: "60vh", overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff" },
    item: { padding: 12, borderRadius: 6, marginBottom: 8, background: "#f8fafc", transition: "box-shadow 200ms ease" },
    itemHeader: { fontSize: 12, color: "#4b5563", marginBottom: 6 },
    message: { fontSize: 15, lineHeight: 1.4 }
  };

    return (
    <div style={{ width: 450, padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          height: "40vh",
          overflowY: "auto",
        }}
      >
        <Container
          footer={
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                padding: "8px 12px",
                boxSizing: "border-box",
              }}
            >
              {/* LEFT: 75% — input, left-aligned */}
              <div style={{ width: "75%" }}>
                <FormField stretch={true} style={{ margin: 0 }}>
                  <Input
                    onChange={({ detail }) => setValue(detail.value)}
                    value={value}
                    placeholder="Keyword search..."
                    style={{ width: "100%" }}
                  />
                </FormField>
              </div>

              {/* RIGHT: 25% — buttons, right-aligned */}
              <div
                style={{
                  width: "25%",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 6,
                }}
              >
                <Button iconName="angle-up" variant="icon" onClick={() => goPrev()} />
                <Button iconName="angle-down" variant="icon" onClick={() => goNext()} />
              </div>
            </div>
          }
        >
          {transcript.map((turn, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent:
                  turn.speaker === "Sophie" ? "flex-start" : "flex-end",
                marginBottom: 8,
              }}
            >
              {summary ? <div
                style={{
                  maxWidth: "60%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor:
                    turn.speaker === "Sophie" ? "#f2f3f5" : "#e6f2ff",
                }}
              >
                <strong>{turn.speaker}:</strong> {turn.message}

              </div> : null}
            </div>
          ))}
        </Container>
      </div>
      <Container
        header={
          <Header variant="h2">
            Summary, Sentiment & Next Steps
          </Header>
        }
      >
        <div
          style={{
            height: "40vh",
            overflowY: "auto",
          }}
        >
          <SpaceBetween size="xs">
            <Container>
              <SpaceBetween direction="horizontal" size="xs">
                <Header
                  variant="h4">Sentiment:</Header>
                {sentiment}
              </SpaceBetween>
            </Container>
            <Container>
              <SpaceBetween size="xs">
                <Header
                  variant="h4">Summary:</Header> {summary.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: "12px" }}>
                      <strong>{item.title}</strong>
                      <div>{item.content}</div>
                    </div>
                  ))}
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </div>
      </Container>
    </div>
  );

  /*return (
    <div style={styles.app}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Transcript Search</h1>

      <div style={styles.controls}>
        <input
          aria-label="Search transcript"
          placeholder="Search keyword or phrase..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.input}
        />

        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={goPrev} title="Previous match" style={styles.btn}>
            ▲
          </button>
          <button onClick={goNext} title="Next match" style={styles.btn}>
            ▼
          </button>
        </div>

        <div style={{ marginLeft: 10, ...styles.meta }}>
          {matches.length > 0 ? (
            <span>
              Match {currentMatchIdx + 1} of {matches.length}
            </span>
          ) : (
            <span>No matches</span>
          )}
        </div>
      </div>

      <div ref={containerRef} style={styles.list}>
        {messages.map((m, i) => {
          const hasMatch = matches.some((mm) => mm.messageIndex === i);
          return (
            <div
              key={m.id}
              ref={(el) => itemRefs.current.set(i, el)}
              style={{
                ...styles.item,
                background: hasMatch ? "#fffbeb" : "#f8fafc"
              }}
            >
              <div style={styles.itemHeader}>
                <strong style={{ marginRight: 8 }}>{m.speaker}</strong>
                <span>{m.time}</span>
              </div>
              <div style={styles.message}>{query ? renderHighlightedText(m.message, query) : m.message}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
        Tip: Press Enter or Arrow keys to move between matches. Replace <code>demoTranscript</code> with your own data if
        you like.
      </div>
    </div>
  );*/
}
