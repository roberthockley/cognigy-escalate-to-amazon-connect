import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ContactClient } from "@amazon-connect/contact";
import { AmazonConnectApp } from "@amazon-connect/app";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts new transcript format (stringified JSON array) back to the old
 * markdown format:
 *   *Speaker*: message
 *
 * If transcriptValue is already markdown, returns it unchanged.
 */
function normalizeTranscriptToMarkdown(transcriptValue, options) {
  options = options || {};

  const botName = options.botName || "Sophie";
  const userName = options.userName || "Customer";
  const agentName = options.agentName || "Agent";
  const systemName = options.systemName || "System";

  const includeSystem =
    typeof options.includeSystem === "boolean" ? options.includeSystem : true;

  if (typeof transcriptValue !== "string") return "";

  const trimmed = transcriptValue.trim();
  if (!trimmed) return "";

  // Old format: already markdown
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
    return transcriptValue;
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    return transcriptValue;
  }

  if (!Array.isArray(parsed)) return transcriptValue;

  const lines = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;

    let speaker = null;
    let text = null;

    if (item.from === "bot") {
      speaker = botName;
      text = item.payload && item.payload.text;
    } else if (item.from === "user") {
      speaker = userName;
      text = item.text;
    } else if (item.from === "agent") {
      speaker = agentName;
      text = item.text; // agent messages appear here in your payload
    } else if (item.from === "system") {
      if (!includeSystem) continue;
      speaker = systemName;
      text = item.text;
    }

    if (!speaker || !text) continue;

    lines.push(`*${speaker}*: ${text}`);
    lines.push("");
  }

  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}


/**
 * Turns normalized markdown into [{speaker, message}, ...]
 * Supports multi-word speaker names.
 */
function parseMarkdownTranscript(markdown) {
  if (!markdown || typeof markdown !== "string") return [];

  return markdown
    .split(/\n\s*\n/g) // split by blank lines
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((turn) => {
      const m = turn.match(/^\*([^*]+)\*:\s*([\s\S]*)$/);
      if (!m) return null;
      return { speaker: m[1].trim(), message: (m[2] || "").trim() };
    })
    .filter(Boolean);
}

export default function App() {
  const [status, setStatus] = useState("Waiting for a contact…");
  const [contactId, setContactId] = useState(null);
  const [channelType, setChannelType] = useState(null);

  const [transcript, setTranscript] = useState([]);
  const [summary, setSummary] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [error, setError] = useState(null);

  // search
  const [query, setQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Prevent double init in React 18 StrictMode (dev)
  const didInit = useRef(false);

  // Hold the single ContactClient instance (optional, but handy)
  const contactClientRef = useRef(null);

  // Map: messageIndex -> DOM node (bubble)
  const itemRefs = useRef(new Map());

  // Connect init
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const { provider } = AmazonConnectApp.init({
      onCreate: () => console.log("App created"),
      onDestroy: () => console.log("App destroyed"),
    });

    const contactClient = new ContactClient({ provider });
    contactClientRef.current = contactClient;

    contactClient.onConnected(async (data) => {
      try {
        const cid = data.contactId;
        setContactId(cid);
        console.log("**** connected", data);

        const attrs = await contactClient.getAttributes(cid, "*");
        console.log("**** attrs", attrs);

        // --- TRANSCRIPT: normalize new format to old markdown, then parse ---
        const normalized = normalizeTranscriptToMarkdown(attrs?.transcript?.value || "", {
          botName: "Sophie",
          userName: "Geoffrey",
          agentName: "GNB Agent",
          systemName: "System",
          includeSystem: true
        });


        console.log("**** normalized:", normalized);

        const parsedTurns = parseMarkdownTranscript(normalized);
        console.log("**** parsedTurns", parsedTurns);
        setTranscript(parsedTurns);

        // --- SENTIMENT ---
        setSentiment(attrs?.sentiment?.value || "No sentiment available");

        // --- SUMMARY ---
        const parsedSummary =
          attrs?.reason?.value
            ?.split(/(?=\*\*\d+\.\s)/g)
            .map((chunk) => {
              const match = chunk.match(
                /^\*\*(\d+\.\s[^*]+)\*\*\s*(?:-\s*)?\n?([\s\S]*)$/
              );
              if (!match) return null;

              return {
                title: match[1].trim(),
                content: match[2].replace(/^\s*-\s*/, "").trim(),
              };
            })
            .filter(Boolean) || [];

        parsedSummary.unshift({ title: null, content: null });
        setSummary(parsedSummary);

        setStatus("Connected");
      } catch (e) {
        console.error(e);
        setError(String(e));
      }
    });

    contactClient.onMissed((data) => console.log("**** missed", data));

    contactClient.onStartingAcw?.((data) => {
      console.log("**** acw", data);
      setTranscript([]);
      setSentiment(null);
      setSummary([]);
      setStatus("Waiting for a contact…");
      setContactId(null);
      setChannelType(null);
      setQuery("");
      setCurrentMatchIdx(0);
    });
  }, []);

  // Build all matches across transcript
  const matches = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    const regex = new RegExp(escapeRegExp(q), "gi");
    const found = [];

    transcript.forEach((turn, messageIndex) => {
      let m;
      while ((m = regex.exec(turn.message)) !== null) {
        found.push({
          messageIndex,
          start: m.index,
          end: m.index + m[0].length,
        });
        if (m.index === regex.lastIndex) regex.lastIndex++;
      }
    });

    return found;
  }, [transcript, query]);

  // Reset current match index when match set changes
  useEffect(() => {
    setCurrentMatchIdx(0);
  }, [matches.length]);

  // Wrap current index safely
  const safeIdx = useMemo(() => {
    if (matches.length === 0) return 0;
    return ((currentMatchIdx % matches.length) + matches.length) % matches.length;
  }, [currentMatchIdx, matches.length]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIdx((prev) => prev + 1);
  }, [matches.length]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIdx((prev) => prev - 1);
  }, [matches.length]);

  // Scroll to current match + flash
  useEffect(() => {
    if (matches.length === 0) return;

    const match = matches[safeIdx];
    const node = itemRefs.current.get(match.messageIndex);

    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "center" });

      const original = node.style.boxShadow;
      node.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.25)";
      const t = setTimeout(() => {
        node.style.boxShadow = original;
      }, 800);

      return () => clearTimeout(t);
    }
  }, [matches, safeIdx]);

  // Keyboard shortcuts (optional)
  useEffect(() => {
    function onKey(e) {
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
  }, [goNext, goPrev]);

  // Highlight query occurrences within a message
  function renderHighlightedText(text) {
    const q = query.trim();
    if (!q) return text;

    const regex = new RegExp(escapeRegExp(q), "gi");
    const parts = [];
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
            borderRadius: 3,
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

return (
  <div style={{ width: 450, padding: 16, fontFamily: "system-ui, sans-serif" }}>
    {/* Transcript */}
    <Container header={<Header variant="h2">Transcript</Header>}>
      <div
        style={{
          height: "35vh",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Scrollable transcript body (ONLY scroller here) */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {transcript.map((turn, index) => {
            const isLeft =
              turn.speaker === "Sophie" ||
              turn.speaker === "System" ||
              turn.speaker === "GNB Agent";

            let bubbleStyle = {};
            if (turn.speaker === "Sophie") {
              bubbleStyle = { backgroundColor: "#e6f2ff", color: "#111827" }; // light blue
            } else if (turn.speaker === "System") {
              bubbleStyle = {
                backgroundColor: "#c7d2fe", // darker blue
                color: "#1e1b4b",
                fontStyle: "italic",
              };
            } else if (turn.speaker === "GNB Agent") {
              bubbleStyle = { backgroundColor: "#dcfce7", color: "#14532d" }; // light green
            } else {
              // Geoffrey (customer)
              bubbleStyle = {
                backgroundColor: "#ffffff",
                color: "#111827",
                border: "1px solid #e5e7eb",
              };
            }

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: isLeft ? "flex-start" : "flex-end",
                  marginBottom: 8,
                }}
              >
                <div
                  ref={(el) => {
                    if (el) itemRefs.current.set(index, el);
                    else itemRefs.current.delete(index);
                  }}
                  style={{
                    maxWidth: "60%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    transition: "box-shadow 200ms ease",
                    ...bubbleStyle,
                  }}
                >
                  <strong>{turn.speaker}:</strong>{" "}
                  {renderHighlightedText(turn.message)}
                </div>
              </div>
            );
          })}

          {transcript.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              {status}
              {error ? ` — ${error}` : ""}
            </div>
          ) : null}
        </div>

        {/* Always-visible footer (no sticky needed) */}
        <div
          style={{
            flexShrink: 0,
            background: "#fff",
            borderTop: "1px solid #e5e7eb",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ width: "70%" }}>
            <FormField stretch={true} style={{ margin: 0 }}>
              <Input
                value={query}
                onChange={({ detail }) => setQuery(detail.value)}
                placeholder="Keyword search..."
              />
            </FormField>

            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {matches.length > 0 ? `${safeIdx + 1} / ${matches.length}` : "0 matches"}
            </div>
          </div>

          <div style={{ width: "30%", display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <Button
              iconName="angle-up"
              variant="icon"
              onClick={goPrev}
              disabled={matches.length === 0}
            />
            <Button
              iconName="angle-down"
              variant="icon"
              onClick={goNext}
              disabled={matches.length === 0}
            />
          </div>
        </div>
      </div>
    </Container>

    {/* Summary / Sentiment */}
    <div style={{ marginTop: 12 }}>
      <Container header={<Header variant="h2">Summary, Sentiment & Next Steps</Header>}>
        <div style={{ height: "35vh", overflowY: "auto" }}>
          <SpaceBetween size="xs">
            <Container>
              <SpaceBetween direction="horizontal" size="xs">
                <Header variant="h4">Sentiment:</Header>
                <div>{sentiment}</div>
              </SpaceBetween>
            </Container>

            <Container>
              <SpaceBetween size="xs">
                <Header variant="h4">Summary:</Header>
                <div>
                  {summary.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 12 }}>
                      {item.title ? <strong>{item.title}</strong> : null}
                      {item.content ? <div>{item.content}</div> : null}
                    </div>
                  ))}
                </div>
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </div>
      </Container>
    </div>
  </div>
);

}