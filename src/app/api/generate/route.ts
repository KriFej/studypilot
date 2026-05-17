import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import type { GenerateResult } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Tu es un assistant pédagogique expert. À partir d'un texte de cours, génère:
1. 10 flashcards (question + réponse courte)
2. 5 questions QCM avec 4 options (A, B, C, D), l'index de la bonne réponse (0-3) et une explication
3. Un résumé en 3-5 phrases

Réponds UNIQUEMENT en JSON valide avec ce format exact:
{
  "flashcards": [{"question": "...", "answer": "..."}],
  "quiz": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}],
  "summary": "..."
}`;

export async function POST(req: NextRequest) {
  try {
    const { documentId, content, apiKey } = await req.json();

    if (!documentId || !content || !apiKey) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const openai = new OpenAI({ apiKey });

    const truncated = content.slice(0, 12000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Voici le texte du cours :\n\n${truncated}` },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const result = JSON.parse(raw) as GenerateResult;

    const flashcards = (result.flashcards ?? []).map((f) => ({
      document_id: documentId,
      user_id: user.id,
      question: f.question,
      answer: f.answer,
    }));

    const quizItems = (result.quiz ?? []).map((q) => ({
      document_id: documentId,
      user_id: user.id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation ?? null,
    }));

    if (flashcards.length > 0) {
      await supabase.from("flashcards").insert(flashcards);
    }
    if (quizItems.length > 0) {
      await supabase.from("quiz_questions").insert(quizItems);
    }

    await supabase
      .from("documents")
      .update({
        summary: result.summary ?? null,
        flashcard_count: flashcards.length,
        quiz_count: quizItems.length,
      })
      .eq("id", documentId);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
