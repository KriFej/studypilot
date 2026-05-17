import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { documentId, message, history, apiKey } = await req.json();

    if (!documentId || !message || !apiKey) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: doc } = await supabase
      .from("documents")
      .select("title, content")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const systemPrompt = `Tu es un professeur expert et pédagogue. Tu aides l'étudiant à comprendre le cours suivant.
Sois clair, concis, et utilise des exemples concrets. Réponds toujours en français.

COURS : "${doc.title}"

CONTENU :
${doc.content.slice(0, 8000)}`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).map((m: { role: "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
    });

    const reply = completion.choices[0].message.content ?? "";

    await supabase.from("chat_messages").insert([
      { document_id: documentId, user_id: user.id, role: "user", content: message },
      { document_id: documentId, user_id: user.id, role: "assistant", content: reply },
    ]);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
