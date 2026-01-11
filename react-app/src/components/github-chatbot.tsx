import * as React from "react";
import { IconMessageCircle, IconSend, IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  location: string | null;
  company: string | null;
  blog: string | null;
  created_at: string;
}

interface GitHubChatbotProps {
  user: GitHubUser | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GitHubChatbot({
  user,
  open: controlledOpen,
  onOpenChange,
}: GitHubChatbotProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: user
        ? `Hello! I'm your GitHub AI assistant. I can help you search repositories, read code, check issues, and more using GitHub MCP. Ask me anything about GitHub!`
        : "Hello! I'm your GitHub AI assistant powered by MCP. I can help you with GitHub repositories, code, issues, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (user && messages.length === 1) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: `Hello! I'm your GitHub AI assistant. I can help you search repositories, read code, check issues, and more using GitHub MCP. Ask me anything about GitHub!`,
          timestamp: new Date(),
        },
      ]);
    }
    // Only run when user changes, not when messages change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sendMessage = async (text: string): Promise<string> => {
    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.reply;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = input;
    setInput("");
    setIsGenerating(true);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const reply = await sendMessage(question);

      // Update assistant message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, content: reply } : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Sorry, I encountered an error: ${
                  error instanceof Error ? error.message : "Unknown error"
                }. Please make sure the agent server is running on http://localhost:8000`,
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg"
        aria-label="Open chat"
      >
        <IconMessageCircle className="size-6" />
      </Button>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar_url} alt={user.login} />
                      <AvatarFallback>
                        {user.login[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>Chat about {user.name || user.login}</span>
                  </>
                ) : (
                  "GitHub Profile Chat"
                )}
              </div>
            </SheetTitle>
            <SheetDescription>
              {user
                ? "Ask questions about GitHub repositories, code, issues, and more. Powered by GitHub MCP and OpenAI."
                : "Please select a GitHub user to start chatting."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex h-[calc(100vh-12rem)] flex-col gap-4 px-4">
            {!user && (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Please select a GitHub user to start chatting.
                  </p>
                </div>
              </div>
            )}
            {user && (
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="mt-1 text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {user && (
              <form onSubmit={handleSend} className="flex gap-2 pb-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about GitHub repositories, code, issues..."
                  className="flex-1"
                  disabled={!user || isGenerating}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || !user || isGenerating}
                  size="icon"
                >
                  {isGenerating ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconSend className="size-4" />
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
