"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { askAssistantAction, type AssistantProperty } from "@/lib/actions/assistant";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  properties?: AssistantProperty[];
  searchHref?: string;
  hrefLabel?: string;
  suggestions?: string[];
}

const OPENING_SUGGESTIONS = [
  "2 bedroom in Makutano under 30k",
  "Rooms near MUST",
  "How do I list my house?",
  "Is it safe?",
];

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi there! I'm the Kheja_Link assistant. I can search every live listing for you, or answer " +
    "anything about how Kheja_Link works — listing a house, fees, safety, your account.\n\n" +
    "What can I help with?",
  suggestions: OPENING_SUGGESTIONS,
};

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const reply = await askAssistantAction(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply.message,
          properties: reply.properties,
          searchHref: reply.searchHref,
          hrefLabel: reply.hrefLabel,
          suggestions: reply.suggestions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I could not reach the listings just then. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* FAB Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        aria-label="Open the Kheja_Link assistant"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center z-50 group border-4 border-white dark:border-zinc-900"
      >
        <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 100, scale: 0.8, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            role="dialog"
            aria-label="Kheja_Link assistant"
            className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-[400px] h-[min(600px,calc(100dvh-6rem))] bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-zinc-900 dark:bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Kheja_Link assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                      Always Online
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close the assistant"
                className="relative w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-hide bg-zinc-50 dark:bg-zinc-900/50"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="space-y-3"
                >
                  <div
                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.role === "user"
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div
                      className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-tr-none"
                          : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <RichText content={msg.content} />
                    </div>
                  </div>

                  {/* Real listings, straight from the database */}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="pl-11 space-y-2">
                      {msg.properties.map((property) => (
                        <Link
                          key={property.id}
                          href={`/properties/${property.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-blue-500 transition-colors group"
                        >
                          <span className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-700 shrink-0">
                            {property.image && (
                              <Image
                                src={property.image}
                                alt=""
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-black text-zinc-900 dark:text-white truncate">
                              {property.title}
                            </span>
                            <span className="block text-[11px] font-bold text-blue-600">
                              {property.price}
                            </span>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate">
                              {property.location}
                            </span>
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* A single call to action, when the answer offers one and
                      there were no listing cards to click through instead. */}
                  {msg.role === "assistant" &&
                    msg.searchHref &&
                    msg.hrefLabel &&
                    (msg.properties?.length ?? 0) === 0 && (
                      <div className="pl-11">
                        <AssistantLink
                          href={msg.searchHref}
                          label={msg.hrefLabel}
                          onNavigate={() => setIsOpen(false)}
                        />
                      </div>
                    )}

                  {/* "See all matches", under a set of listing cards. */}
                  {msg.role === "assistant" &&
                    msg.searchHref &&
                    (msg.properties?.length ?? 0) > 0 && (
                      <div className="pl-11">
                        <AssistantLink
                          href={msg.searchHref}
                          label={msg.hrefLabel ?? "See all matches"}
                          onNavigate={() => setIsOpen(false)}
                        />
                      </div>
                    )}

                  {/* Follow-ups, so there is always somewhere obvious to go. */}
                  {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="pl-11 flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => send(suggestion)}
                          disabled={isTyping}
                          className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-3xl rounded-tl-none border border-zinc-200 dark:border-zinc-700">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(inputValue);
              }}
              className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0"
            >
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Ask about Meru rentals..."
                  aria-label="Ask the Kheja_Link assistant"
                  className="w-full h-12 sm:h-14 pl-4 sm:pl-5 pr-14 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 text-zinc-900 dark:text-white font-medium placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Send"
                  className="absolute right-1.5 top-1.5 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-4 text-[10px] text-center text-zinc-400 font-black uppercase tracking-widest">
                Searching live Kheja_Link listings
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Renders an assistant answer: blank lines become paragraphs, lines starting
 * with a bullet stay bulleted, and **text** is emphasised. Deliberately not a
 * markdown library — the assistant only ever emits these three things, and the
 * content is ours rather than user input.
 */
function RichText({ content }: { content: string }) {
  const blocks = content.split("\n").filter((line) => line.trim().length > 0);

  return (
    <div className="space-y-1.5">
      {blocks.map((line, index) => {
        const isBullet = line.trimStart().startsWith("•");
        const text = isBullet ? line.trimStart().slice(1).trim() : line;

        return (
          <p key={index} className={isBullet ? "flex gap-2" : undefined}>
            {isBullet && <span className="text-blue-600 shrink-0">•</span>}
            <span>{renderEmphasis(text)}</span>
          </p>
        );
      })}
    </div>
  );
}

/** Turns **bold** runs into <strong>, leaving everything else as text. */
function renderEmphasis(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/** The single call-to-action link under an answer. */
function AssistantLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  const isExternal = href.startsWith("http");

  const className =
    "inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors py-1";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    );
  }

  return (
    <Link href={href} onClick={onNavigate} className={className}>
      {label}
      <ArrowUpRight className="w-3.5 h-3.5" />
    </Link>
  );
}
