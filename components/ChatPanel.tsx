"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ListingData, DefectReport } from "@/lib/types";

const SUGGESTED = [
  "Is this a good buy at this price?",
  "What's the most concerning issue?",
  "What should I negotiate on?",
  "Give me a ballpark market value.",
];

interface Props {
  listing: ListingData;
  defectReport?: DefectReport;
}

export default function ChatPanel({ listing, defectReport }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, listing, defectReport }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              acc += parsed.text;
              setMessages((prev) => {
                const u = [...prev];
                u[u.length - 1] = { role: "assistant", content: acc };
                return u;
              });
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: `Something went wrong: ${msg}` };
        return u;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="rounded-[16px] bg-[#0f0f0f] border border-white/[0.07] flex flex-col h-[540px]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[7px] bg-[#0a84ff]/15 border border-[#0a84ff]/25 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#0a84ff]" viewBox="0 0 12 12" fill="none">
              <path d="M1 8.5V3a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0111 3v4a1.5 1.5 0 01-1.5 1.5H4L1 10V8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white/85">Advisor</p>
            <p className="text-[11px] text-white/25">Blunt, direct used-car advice</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[12px] text-white/25 text-center mb-4">Ask anything. Expect straight answers.</p>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="w-full text-left text-[13px] text-white/55 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] rounded-[10px] px-3.5 py-2.5 transition-all duration-150"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-[13px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === "user"
                ? "bg-[#0a84ff] text-white"
                : "bg-[#161616] text-white/75 border border-white/[0.07]"
            }`}>
              {msg.content || (
                streaming && i === messages.length - 1 ? (
                  <span className="flex items-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                ) : ""
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3.5 py-3 border-t border-white/[0.06] shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about this listing…"
            rows={1}
            disabled={streaming}
            className="flex-1 bg-[#161616] border border-white/[0.08] focus:border-white/[0.16] rounded-[10px] px-3 py-2.5 text-[13px] text-white/80 placeholder-white/20 resize-none focus:outline-none disabled:opacity-40 leading-relaxed transition-colors"
            style={{ maxHeight: 100, overflowY: "auto" }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-8 h-8 rounded-[9px] bg-[#0a84ff] hover:bg-[#409cff] disabled:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            {streaming ? (
              <div className="w-3 h-3 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 text-white disabled:text-white/20" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7.5 2L13 7l-5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-white/15 mt-2">Return to send · Shift+Return for new line</p>
      </div>
    </div>
  );
}
