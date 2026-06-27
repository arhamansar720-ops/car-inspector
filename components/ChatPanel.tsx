"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ListingData, DefectReport } from "@/lib/types";

interface ChatPanelProps {
  listing: ListingData;
  defectReport?: DefectReport;
}

export default function ChatPanel({ listing, defectReport }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    // Placeholder for assistant streaming response
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages([...nextMessages, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, listing, defectReport }),
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: accumulated };
                return updated;
              });
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Chat failed";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Sorry, something went wrong: ${errorText}`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const SUGGESTED_QUESTIONS = [
    "Is this a good buy at this price?",
    "Explain the most concerning defect",
    "What should I negotiate on?",
    "What's a fair market price?",
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 14 14" fill="none">
            <path d="M2 10V4a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H5l-3 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Ask the Advisor</div>
          <div className="text-[11px] text-zinc-500">Blunt used-car advice — no wishy-washy hedging</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-500 text-center mb-4">
              Ask anything about this listing. I&apos;ll give you a straight answer.
            </p>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-sm text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl px-3.5 py-2.5 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-200 border border-zinc-700/50"
              }`}
            >
              {msg.content || (streaming && i === messages.length - 1 ? (
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              ) : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this listing…"
            rows={1}
            disabled={streaming}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50 leading-relaxed"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors"
          >
            {streaming ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
