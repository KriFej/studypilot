import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getMonthlyMessages, PLAN_LIMITS } from "@/lib/limits";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { documentId, message, history } = await req.json();

    if (!documentId || !message) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Vérification limite messages mensuels
    const [plan, msgCount] = await Promise.all([
      getUserPlan(user.id),
      getMonthlyMessages(user.id),
    ]);
    const msgLimit = PLAN_LIMITS[plan].messages;
    if (msgCount >= msgLimit) {
      return NextResponse.json(
        { error: "limit_messages", message: `Tu as atteint la limite de ${msgLimit} messages ce mois-ci. Passe à Pro pour continuer.` },
        { status: 403 }
      );
    }

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
      ...(history ?? []).slice(-10).map((m: { role: "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
    });

    const reply = completion.choices[0].message.content ?? "";

    // Incrément atomique + sauvegarde messages en parallèle
    const yearMonth = new Date().toISOString().slice(0, 7);
    await Promise.all([
      supabase.rpc("increment_messages", { p_user_id: user.id, p_year_month: yearMonth }),
      supabase.from("chat_messages").insert([
        { document_id: documentId, user_id: user.id, role: "user", content: message },
        { document_id: documentId, user_id: user.id, role: "assistant", content: reply },
      ]),
    ]);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
