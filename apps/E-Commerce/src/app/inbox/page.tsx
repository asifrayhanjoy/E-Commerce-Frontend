"use client";

import axiosInstance from "@/utils/axiosinstance";
import useUser from "@/hooks/use.User";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ChatRole = "user" | "seller";

type ChatSocket = {
  connected?: boolean;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  disconnect: () => void;
};

type SocketIoFactory = (
  url: string,
  options?: Record<string, unknown>
) => ChatSocket;

declare global {
  interface Window {
    io?: SocketIoFactory;
  }
}

type ChatMessage = {
  id: string;
  conversationId: string;
  senderRole: ChatRole;
  text: string;
  createdAt: string;
};

type ChatConversation = {
  id: string;
  buyerUnreadCount?: number;
  sellerUnreadCount?: number;
  lastMessageText?: string;
  lastMessageAt?: string;
  seller?: {
    name?: string;
    shop?: {
      name?: string;
    };
  };
  product?: {
    title?: string;
    images?: { url?: string }[];
  };
};

const chatSocketUrl =
  process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "http://localhost:8484";

const loadSocketClient = () =>
  new Promise<SocketIoFactory>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Socket client can only load in the browser."));
      return;
    }

    if (window.io) {
      resolve(window.io);
      return;
    }

    const scriptId = "chat-socket-io-client";
    const existingScript = document.getElementById(
      scriptId
    ) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.io) {
        resolve(window.io);
        return;
      }

      reject(new Error("Socket client did not initialize."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Socket client could not load.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `${chatSocketUrl}/socket.io/socket.io.js`;
    script.async = true;
    script.onload = handleLoad;
    script.onerror = () => reject(new Error("Socket client could not load."));
    document.body.appendChild(script);
  });

const getProductImage = (conversation?: ChatConversation) =>
  conversation?.product?.images?.find((image) => image?.url)?.url || "";

const getConversationTitle = (conversation: ChatConversation) =>
  conversation.seller?.shop?.name ||
  conversation.seller?.name ||
  "Seller conversation";

const formatTime = (value?: string) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const fetchConversations = async () => {
  const response = await axiosInstance.get("/api/v1/chats/conversations");
  return Array.isArray(response.data?.conversations)
    ? (response.data.conversations as ChatConversation[])
    : [];
};

const fetchMessages = async (conversationId: string) => {
  const response = await axiosInstance.get(
    `/api/v1/chats/conversations/${conversationId}/messages`
  );

  return Array.isArray(response.data?.messages)
    ? (response.data.messages as ChatMessage[])
    : [];
};

export default function CustomerInboxPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const requestedConversationId = searchParams.get("conversationId") || "";
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [sendError, setSendError] = useState("");

  const {
    data: conversations = [],
    isLoading: isConversationLoading,
    isError: isConversationError,
  } = useQuery({
    queryKey: ["chat-conversations", "user"],
    queryFn: fetchConversations,
    enabled: Boolean(user),
    retry: false,
  });

  useEffect(() => {
    if (requestedConversationId) {
      setSelectedConversationId(requestedConversationId);
      return;
    }

    if (!selectedConversationId && conversations[0]?.id) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, requestedConversationId, selectedConversationId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ),
    [conversations, selectedConversationId]
  );

  const {
    data: messages = [],
    isLoading: isMessageLoading,
    isError: isMessageError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["chat-messages", selectedConversationId],
    queryFn: () => fetchMessages(selectedConversationId),
    enabled: Boolean(user && selectedConversationId),
    retry: false,
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;
    let nextSocket: ChatSocket | null = null;

    loadSocketClient()
      .then((socketFactory) => {
        if (!isMounted) {
          return;
        }

        nextSocket = socketFactory(chatSocketUrl, {
          withCredentials: true,
          auth: { role: "user" },
        });

        setSocket(nextSocket);

        nextSocket.on("message:received", (payload) => {
          queryClient.invalidateQueries({
            queryKey: ["chat-conversations", "user"],
          });

          if (payload?.message?.conversationId === selectedConversationId) {
            queryClient.setQueryData<ChatMessage[]>(
              ["chat-messages", selectedConversationId],
              (current = []) =>
                current.some((message) => message.id === payload.message.id)
                  ? current
                  : [...current, payload.message]
            );
          }
        });

        nextSocket.on("conversation:updated", () => {
          queryClient.invalidateQueries({
            queryKey: ["chat-conversations", "user"],
          });
        });
      })
      .catch(() => {
        if (isMounted) {
          setSocket(null);
        }
      });

    return () => {
      isMounted = false;
      nextSocket?.disconnect();
      setSocket(null);
    };
  }, [queryClient, selectedConversationId, user]);

  useEffect(() => {
    if (!socket || !selectedConversationId) {
      return;
    }

    socket.emit("conversation:join", {
      conversationId: selectedConversationId,
    });
    axiosInstance
      .patch(`/api/v1/chats/conversations/${selectedConversationId}/read`)
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["chat-conversations", "user"] })
      )
      .catch(() => undefined);

    return () => {
      socket.emit("conversation:leave", {
        conversationId: selectedConversationId,
      });
    };
  }, [queryClient, selectedConversationId, socket]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = messageText.trim();

    if (!text || !selectedConversationId) {
      return;
    }

    setSendError("");

    if (socket?.connected) {
      socket.emit(
        "message:send",
        { conversationId: selectedConversationId, text },
        (response: any) => {
          if (!response?.success) {
            setSendError(response?.message || "Message could not be sent.");
            return;
          }

          setMessageText("");
          refetchMessages();
        }
      );
      return;
    }

    try {
      await axiosInstance.post(
        `/api/v1/chats/conversations/${selectedConversationId}/messages`,
        { text }
      );
      setMessageText("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["chat-conversations", "user"] });
    } catch (error: any) {
      setSendError(error?.response?.data?.message || "Message could not be sent.");
    }
  };

  if (!isUserLoading && !user) {
    return (
      <main className="min-h-[70vh] bg-[#f6f7fb] px-6 py-12">
        <div className="mx-auto flex min-h-[320px] max-w-3xl items-center justify-center rounded-md bg-white text-center">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Inbox</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Sign in to view your conversations.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex h-11 items-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[75vh] bg-[#f6f7fb] px-4 py-8">
      <section className="mx-auto grid h-[720px] max-w-7xl grid-cols-[360px_1fr] overflow-hidden rounded-md bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]">
        <aside className="border-r border-slate-100 bg-slate-50">
          <div className="border-b border-slate-100 px-5 py-5">
            <h1 className="text-2xl font-black text-slate-950">Inbox</h1>
          </div>

          <div className="h-[648px] overflow-y-auto">
            {isConversationLoading && (
              <p className="px-5 py-6 text-sm font-semibold text-slate-500">
                Loading conversations...
              </p>
            )}

            {isConversationError && (
              <p className="px-5 py-6 text-sm font-semibold text-red-500">
                Conversations could not be loaded.
              </p>
            )}

            {!isConversationLoading &&
              !isConversationError &&
              conversations.length === 0 && (
                <p className="px-5 py-6 text-sm font-semibold text-slate-500">
                  No conversations yet.
                </p>
              )}

            {conversations.map((conversation) => {
              const unreadCount = Number(conversation.buyerUnreadCount || 0);
              const isSelected = conversation.id === selectedConversationId;
              const imageUrl = getProductImage(conversation);

              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition ${
                    isSelected ? "bg-white" : "hover:bg-white"
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={conversation.product?.title || "Product"}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getConversationTitle(conversation).charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-950">
                        {getConversationTitle(conversation)}
                      </p>
                      <span className="shrink-0 text-xs font-semibold text-slate-400">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {conversation.product?.title || "Product chat"}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-slate-500">
                        {conversation.lastMessageText || "No messages yet."}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-black text-slate-950">
                  {getConversationTitle(selectedConversation)}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedConversation.product?.title || "Product chat"}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-5">
                {isMessageLoading && (
                  <p className="text-sm font-semibold text-slate-500">
                    Loading messages...
                  </p>
                )}

                {isMessageError && (
                  <p className="text-sm font-semibold text-red-500">
                    Messages could not be loaded.
                  </p>
                )}

                <div className="grid gap-3">
                  {messages.map((message) => {
                    const isMine = message.senderRole === "user";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[68%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                            isMine
                              ? "rounded-br-sm bg-blue-600 text-white"
                              : "rounded-bl-sm bg-white text-slate-700 shadow-sm"
                          }`}
                        >
                          <p>{message.text}</p>
                          <p
                            className={`mt-1 text-[11px] ${
                              isMine ? "text-blue-100" : "text-slate-400"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form
                className="border-t border-slate-100 bg-white px-5 py-4"
                onSubmit={handleSendMessage}
              >
                {sendError && (
                  <p className="mb-2 text-sm font-semibold text-red-500">
                    {sendError}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Write a message"
                    className="h-12 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
                    aria-label="Send message"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-500">
              Select a conversation.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
