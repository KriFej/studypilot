export type Document = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string | null;
  flashcard_count: number | null;
  quiz_count: number | null;
  created_at: string;
  updated_at: string;
};

export type Flashcard = {
  id: string;
  document_id: string;
  user_id: string;
  question: string;
  answer: string;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  document_id: string;
  user_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  document_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type GenerateResult = {
  flashcards: Pick<Flashcard, "question" | "answer">[];
  quiz: Pick<QuizQuestion, "question" | "options" | "correct_index" | "explanation">[];
  summary: string;
};
