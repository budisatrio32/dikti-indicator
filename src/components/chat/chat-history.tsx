"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Button,
  ContainedList,
  ContainedListItem,
  InlineNotification,
  Modal,
  OverflowMenu,
  OverflowMenuItem,
  SkeletonText,
} from "@carbon/react";
import { ArrowLeft, Chat } from "@carbon/icons-react";
import { deleteConversation, listConversations } from "@/lib/chat-client";
import { useChatStore } from "@/store/chat-store";
import type { ChatScope, ConversationSummary } from "@/types/chat";
import styles from "./chat.module.scss";

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function ChatHistory({ scope }: { scope: ChatScope }) {
  const setView = useChatStore((state) => state.setView);
  const loadConversation = useChatStore((state) => state.loadConversation);
  const activeConversationId = useChatStore((state) => state.threads[scope.id]?.conversationId);
  const newChat = useChatStore((state) => state.newChat);

  // DATA: GET /api/chat/conversations?scope=<id>
  const { data, error, isLoading, mutate } = useSWR(["chat-conversations", scope.id], ([, scopeId]) =>
    listConversations(scopeId)
  );
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteConversation(pendingDelete.id);
      await mutate((current) => current?.filter((item) => item.id !== pendingDelete.id), { revalidate: false });
      if (pendingDelete.id === activeConversationId) newChat(scope.id);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus percakapan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.bodyInner}>
      <div className={styles.historyHeader}>
        <h3 className={styles.historyTitle}>Riwayat · {scope.label}</h3>
        <Button kind="ghost" size="sm" renderIcon={ArrowLeft} onClick={() => setView("chat")}>
          Kembali
        </Button>
      </div>

      {isLoading && <SkeletonText paragraph lineCount={4} />}

      {error && (
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title="Riwayat gagal dimuat."
          subtitle={error instanceof Error ? error.message : undefined}
        />
      )}

      {data && data.length === 0 && (
        <p className={styles.note}>Belum ada percakapan tersimpan untuk {scope.label}.</p>
      )}

      {data && data.length > 0 && (
        <div className={styles.historyList}>
          <ContainedList label={`Percakapan terakhir di ${scope.label}`} kind="on-page" size="lg">
            {data.map((conversation) => (
              <ContainedListItem
                key={conversation.id}
                renderIcon={Chat}
                onClick={() => void loadConversation(scope.id, conversation.id)}
                action={
                  <OverflowMenu size="sm" flipped aria-label={`Opsi untuk ${conversation.title}`}>
                    <OverflowMenuItem
                      itemText="Hapus percakapan"
                      isDelete
                      onClick={() => setPendingDelete(conversation)}
                    />
                  </OverflowMenu>
                }
              >
                {conversation.title}
                <span className={styles.historyItemMeta}>
                  {dateTimeFormat.format(new Date(conversation.updatedAt))} · {conversation.messageCount} pesan
                </span>
              </ContainedListItem>
            ))}
          </ContainedList>
        </div>
      )}

      <Modal
        open={pendingDelete !== null}
        danger
        size="xs"
        modalHeading="Hapus percakapan?"
        primaryButtonText={isDeleting ? "Menghapus…" : "Hapus"}
        secondaryButtonText="Batal"
        primaryButtonDisabled={isDeleting}
        onRequestClose={() => setPendingDelete(null)}
        onRequestSubmit={() => void confirmDelete()}
      >
        <p className={styles.note}>
          “{pendingDelete?.title}” akan dihapus permanen dari riwayat Anda. Tindakan ini tidak dapat dibatalkan.
        </p>
        {deleteError && (
          <InlineNotification kind="error" lowContrast hideCloseButton title="Gagal menghapus." subtitle={deleteError} />
        )}
      </Modal>
    </div>
  );
}
