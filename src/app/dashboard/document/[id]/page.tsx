"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Layers, HelpCircle, MessageSquare, ChevronDown, ChevronUp,
  Send, Loader2, CheckCircle, XCircle, BookOpen, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Document, Flashcard, QuizQuestion, ChatMessage } from "@/lib/types";

type Tab = "flashcards" | "quiz" | "chat";
type FlashcardState = { [id: string]: boolean };

function FlashcardItem({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((v) => !v)}
      className="w-full rounded-3xl border border-border bg-card p-5 text-left transition-all hover:border-primary-500/40 hover:bg-card-hover group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {!flipped ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-400 mb-2">Question</p>
              <p className="text-sm font-medium text-fg">{card.question}</p>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-success-500 mb-2">Réponse</p>
              <p className="text-sm text-fg">{card.answer}</p>
            </div>
          )}
        </div>
        <div className="shrink-0 text-dim group-hover:text-muted transition-colors">
          {flipped ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
    </button>
  );
}

function QuizItem({ q, index }: { q: QuizQuestion; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="mb-4 text-sm font-medium text-fg">
        <span className="mr-2 text-muted">{index + 1}.</span>
        {q.question}
      </p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct_index;
          const isSelected = i === selected;
          let cls = "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all cursor-pointer ";
          if (!answered) {
            cls += "border-border hover:border-primary-500/50 hover:bg-primary-tint text-fg";
          } else if (isCorrect) {
            cls += "border-success-500/50 bg-success-tint text-success-500";
          } else if (isSelected && !isCorrect) {
            cls += "border-red-500/50 bg-red-500/10 text-red-400";
          } else {
            cls += "border-border text-muted opacity-50";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setSelected(i)}
              className={cls}
            >
              {answered && isCorrect && <CheckCircle size={14} className="shrink-0" />}
              {answered && isSelected && !isCorrect && <XCircle size={14} className="shrink-0" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && q.explanation && (
        <p className="mt-3 rounded-2xl bg-surface px-4 py-2.5 text-xs text-muted">
          {q.explanation}
        </p>
      )}
    </div>
  );
}

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const [doc, setDoc] = useState<Document | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tab, setTab] = useState<Tab>("flashcards");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || !id) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("documents").select("*").eq("id", id).eq("user_id", userId).single(),
      supabase.from("flashcards").select("*").eq("document_id", id).order("created_at"),
      supabase.from("quiz_questions").select("*").eq("document_id", id).order("created_at"),
      supabase.from("chat_messages").select("*").eq("document_id", id).order("created_at"),
    ]).then(([{ data: d }, { data: fc }, { data: qz }, { data: cm }]) => {
      setDoc(d);
      setFlashcards(fc ?? []);
      setQuiz(qz ?? []);
      setMessages(cm ?? []);
      setLoading(false);
    });
  }, [userId, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  async function sendMessage() {
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    const tempMsg: ChatMessage = {
      id: crypto.randomUUID(),
      document_id: id,
      user_id: userId!,
      role: "user",
      content: userMsg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: id,
          message: userMsg,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      const reply = res.status === 403
        ? json.message ?? "Limite atteinte. Passe à Pro pour continuer."
        : (json.reply ?? "Erreur lors de la réponse.");
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        document_id: id,
        user_id: userId!,
        role: "assistant",
        content: reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setChatLoading(false);
    }
  }

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
        tab === t ? "bg-primary-500 text-white" : "text-muted hover:text-fg"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          tab === t ? "bg-white/20 text-white" : "bg-border text-muted"
        }`}>{count}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-8 text-center text-muted">
        Document introuvable.{" "}
        <Link href="/dashboard" className="text-primary-400 hover:underline">Retour</Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <Link href="/dashboard" className="mb-3 flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors">
          <ArrowLeft size={13} /> Tableau de bord
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-fg">{doc.title}</h1>
            {doc.summary && (
              <p className="mt-1 text-sm text-muted line-clamp-2">{doc.summary}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 rounded-full border border-border bg-surface p-1 w-fit">
          {tabBtn("flashcards", <Layers size={14} />, "Flashcards", flashcards.length)}
          {tabBtn("quiz", <HelpCircle size={14} />, "Quiz", quiz.length)}
          {tabBtn("chat", <MessageSquare size={14} />, "Professeur IA")}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "flashcards" && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {flashcards.length === 0 ? (
              <EmptyContent icon={<Layers size={20} />} label="Aucune flashcard générée" />
            ) : (
              flashcards.map((fc) => <FlashcardItem key={fc.id} card={fc} />)
            )}
          </div>
        )}

        {tab === "quiz" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {quiz.length === 0 ? (
              <EmptyContent icon={<HelpCircle size={20} />} label="Aucune question générée" />
            ) : (
              quiz.map((q, i) => <QuizItem key={q.id} q={q} index={i} />)
            )}
          </div>
        )}

        {tab === "chat" && (
          <div className="flex h-full flex-col max-w-2xl mx-auto">
            <div className="flex-1 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint">
                    <BookOpen size={22} className="text-primary-400" />
                  </div>
                  <p className="text-sm font-medium text-fg">Pose une question sur ce cours</p>
                  <p className="text-xs text-muted">Le professeur IA connaît tout le contenu du document.</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-primary-500 text-white rounded-br-lg"
                        : "bg-card border border-border text-fg rounded-bl-lg"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-3xl rounded-bl-lg border border-border bg-card px-4 py-3">
                    <Loader2 size={14} className="animate-spin text-muted" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Pose une question sur ce cours…"
                className="flex-1 h-11 rounded-full border border-border bg-surface px-4 text-sm text-fg placeholder:text-dim focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyContent({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted">{icon}</div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
