// Satu-satunya pintu akses API Asisten IKU dari sisi klien.
// Mode mock aktif selama NEXT_PUBLIC_CHAT_MOCK !== "false" (endpoint belum tersedia: API NOT FOUND).

import {
  CHAT_DISCLAIMER,
  MOCK_ERROR_KEYWORD,
  pickMockAnswer,
} from "@/lib/chat-mock";
import type { ChatAnswer, ChatRequest, FeedbackValue } from "@/types/chat";

const USE_MOCK = process.env.NEXT_PUBLIC_CHAT_MOCK !== "false";

export type SendOptions = {
  signal?: AbortSignal;
  /** Progres retrieval, mis. "Mencari di Buku IKU…". */
  onStatus?: (text: string) => void;
  /** Potongan teks jawaban (streaming). */
  onToken?: (chunk: string) => void;
};

export class ChatClientError extends Error {}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

async function sendQuestionMock(req: ChatRequest, { signal, onStatus, onToken }: SendOptions): Promise<ChatAnswer> {
  const mock = pickMockAnswer(req.question, req.scope);
  onStatus?.(mock.statusText);
  await wait(1200, signal);

  if (req.question.toLowerCase().includes(MOCK_ERROR_KEYWORD)) {
    throw new ChatClientError("Layanan Asisten IKU sedang tidak dapat dihubungi. Coba lagi beberapa saat.");
  }

  for (const word of mock.answer.split(/(\s+)/)) {
    await wait(25, signal);
    onToken?.(word);
  }

  return {
    conversationId: req.conversationId ?? `conv-${Date.now()}`,
    messageId: `msg-${Date.now()}`,
    answer: mock.answer,
    blocks: mock.blocks,
    citations: mock.citations,
    grounded: mock.grounded,
    confidence: mock.confidence,
    action: mock.action,
    outOfScope: mock.outOfScope,
    disclaimer: CHAT_DISCLAIMER,
  };
}

async function readError(response: Response) {
  try {
    const json = (await response.json()) as { error?: string };
    return json.error || "Gagal memproses pertanyaan.";
  } catch {
    return "Gagal memproses pertanyaan.";
  }
}

// DATA: POST /api/chat (API NOT FOUND). Versi streaming (SSE) ditambahkan setelah kontrak disepakati BE.
async function sendQuestionApi(req: ChatRequest, { signal, onToken }: SendOptions): Promise<ChatAnswer> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!response.ok) throw new ChatClientError(await readError(response));
  const answer = (await response.json()) as ChatAnswer;
  onToken?.(answer.answer);
  return answer;
}

export function sendQuestion(req: ChatRequest, options: SendOptions = {}) {
  return USE_MOCK ? sendQuestionMock(req, options) : sendQuestionApi(req, options);
}

// DATA: POST /api/chat/messages/:id/feedback (API NOT FOUND)
export async function sendFeedback(messageId: string, value: FeedbackValue): Promise<void> {
  if (USE_MOCK) return;
  const response = await fetch(`/api/chat/messages/${encodeURIComponent(messageId)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  if (!response.ok) throw new ChatClientError(await readError(response));
}
