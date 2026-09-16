"use client";

import { Button } from "@carbon/react";
import { useChatStore, type ChatThread } from "@/store/chat-store";
import type { ChatScope } from "@/types/chat";
import { AssistantMessage } from "./assistant-message";
import styles from "./chat.module.scss";

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const formatted = dateFormat.format(date);
  if (date.toDateString() === today.toDateString()) return `Hari ini, ${formatted}`;
  if (date.toDateString() === yesterday.toDateString()) return `Kemarin, ${formatted}`;
  return formatted;
}

export function MessageList({ scope, thread }: { scope: ChatScope; thread: ChatThread }) {
  const showHidden = useChatStore((state) => state.showHidden);
  const { messages, hiddenCount, isSending } = thread;

  const visible = messages.slice(hiddenCount);
  if (visible.length === 0) return null;

  return (
    <>
      {hiddenCount > 0 ? (
        <div className={styles.divider}>
          <Button kind="ghost" size="sm" onClick={() => showHidden(scope.id)}>
            Tampilkan {hiddenCount} pesan sebelumnya
          </Button>
        </div>
      ) : (
        <p className={styles.divider}>{dayLabel(visible[0].createdAt)}</p>
      )}

      <ol className={styles.messageList} role="log" aria-live="polite" aria-label={`Percakapan Asisten IKU · ${scope.label}`}>
        {visible.map((message) => (
          <li key={message.id}>
            {message.role === "user" ? (
              <div className={styles.userMessage}>
                <p className={styles.meta}>
                  Anda · <time dateTime={message.createdAt}>{timeFormat.format(new Date(message.createdAt))}</time>
                </p>
                <p className={styles.userBubble}>{message.text}</p>
              </div>
            ) : (
              <AssistantMessage message={message} scope={scope} isSending={isSending} />
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
