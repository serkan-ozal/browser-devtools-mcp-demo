import * as React from "react";
import { IconMessageCircle, IconSend } from "@tabler/icons-react";

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

interface StressAnalysis {
  totalCommits: number;
  averageStressScore: number;
  stressTrend: number;
  mostStressedCommits: Array<{
    sha: string;
    message: string;
    stressScore: number;
    repo: string;
  }>;
  weeklyStress: Array<{
    week: string;
    averageStress: number;
    commitCount: number;
  }>;
  stressByTime: {
    night: number;
    day: number;
  };
  stressByType: {
    messageStress: number;
    fileSpike: number;
    nightAggressive: number;
  };
}

interface GitHubChatbotProps {
  user: GitHubUser | null;
  codingStats?: {
    coderType: "Night Coder" | "Daily Coder";
    nightPercentage: number;
    dayPercentage: number;
  } | null;
  topLanguages?: Array<{
    language: string;
    percentage: number;
  }> | null;
  stressAnalysis?: StressAnalysis | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function generateResponse(
  question: string,
  user: GitHubUser | null,
  codingStats: GitHubChatbotProps["codingStats"],
  topLanguages: GitHubChatbotProps["topLanguages"],
  stressAnalysis: GitHubChatbotProps["stressAnalysis"]
): string {
  if (!user) {
    return "Please search for a GitHub user first to ask questions about their profile.";
  }

  const lowerQuestion = question.toLowerCase();

  // Name and username
  if (lowerQuestion.includes("name") || lowerQuestion.includes("who")) {
    return `${user.name || user.login} (@${user.login}) is a GitHub user with ${
      user.public_repos
    } public repositories, ${user.followers} followers, and following ${
      user.following
    } users.`;
  }

  // Bio
  if (lowerQuestion.includes("bio") || lowerQuestion.includes("about")) {
    return user.bio
      ? `${user.name || user.login}'s bio: "${user.bio}"`
      : `${
          user.name || user.login
        } doesn't have a bio on their GitHub profile.`;
  }

  // Location
  if (
    lowerQuestion.includes("location") ||
    lowerQuestion.includes("where") ||
    lowerQuestion.includes("live")
  ) {
    return user.location
      ? `${user.name || user.login} is located in ${user.location}.`
      : `Location information is not available for ${user.name || user.login}.`;
  }

  // Company
  if (
    lowerQuestion.includes("company") ||
    lowerQuestion.includes("work") ||
    lowerQuestion.includes("employer")
  ) {
    return user.company
      ? `${user.name || user.login} works at ${user.company}.`
      : `Company information is not available for ${user.name || user.login}.`;
  }

  // Repositories
  if (
    lowerQuestion.includes("repo") ||
    lowerQuestion.includes("repository") ||
    lowerQuestion.includes("project")
  ) {
    return `${user.name || user.login} has ${
      user.public_repos
    } public repositories on GitHub.`;
  }

  // Followers
  if (lowerQuestion.includes("follower")) {
    return `${user.name || user.login} has ${
      user.followers
    } followers on GitHub.`;
  }

  // Coding time
  if (
    (lowerQuestion.includes("night") || lowerQuestion.includes("day")) &&
    codingStats
  ) {
    return `${user.name || user.login} is a ${
      codingStats.coderType
    }. They code ${
      codingStats.nightPercentage
    }% during night hours (22:00-03:00) and ${
      codingStats.dayPercentage
    }% during day hours (04:00-21:00).`;
  }

  // Languages
  if (
    (lowerQuestion.includes("language") ||
      lowerQuestion.includes("programming")) &&
    topLanguages &&
    topLanguages.length > 0
  ) {
    const languages = topLanguages
      .map((lang) => `${lang.language} (${lang.percentage}%)`)
      .join(", ");
    return `The top programming languages used by ${
      user.name || user.login
    } are: ${languages}`;
  }

  // Stress analysis questions
  if (
    (lowerQuestion.includes("stress") ||
      lowerQuestion.includes("panic") ||
      lowerQuestion.includes("rushed") ||
      lowerQuestion.includes("urgent") ||
      lowerQuestion.includes("pressure")) &&
    stressAnalysis
  ) {
    const stressLevel = stressAnalysis.averageStressScore;
    const stressLevelLabel =
      stressLevel < 0.3 ? "low" : stressLevel < 0.6 ? "moderate" : "high";

    let response = `${
      user.name || user.login
    } has a ${stressLevelLabel} stress level (${(stressLevel * 100).toFixed(
      1
    )}%) based on ${stressAnalysis.totalCommits} commits analyzed. `;

    if (
      lowerQuestion.includes("trend") ||
      lowerQuestion.includes("change") ||
      lowerQuestion.includes("increase") ||
      lowerQuestion.includes("decrease")
    ) {
      if (stressAnalysis.stressTrend > 0) {
        response += `⚠️ Stress levels have increased by ${Math.abs(
          stressAnalysis.stressTrend
        ).toFixed(1)}% in the last 2 weeks. `;
      } else if (stressAnalysis.stressTrend < 0) {
        response += `✅ Stress levels have decreased by ${Math.abs(
          stressAnalysis.stressTrend
        ).toFixed(1)}% in the last 2 weeks. `;
      } else {
        response += `Stress levels have remained stable. `;
      }
    }

    if (lowerQuestion.includes("night") || lowerQuestion.includes("late")) {
      response += `Night-time stress (22:00-05:00) is ${(
        stressAnalysis.stressByTime.night * 100
      ).toFixed(1)}%, while day-time stress is ${(
        stressAnalysis.stressByTime.day * 100
      ).toFixed(1)}%. `;
    }

    if (
      (lowerQuestion.includes("commit") && lowerQuestion.includes("most")) ||
      lowerQuestion.includes("worst")
    ) {
      if (stressAnalysis.mostStressedCommits.length > 0) {
        const topCommit = stressAnalysis.mostStressedCommits[0];
        response += `The most stressed commit was "${
          topCommit.message.split("\n")[0]
        }" in ${topCommit.repo} with a ${(topCommit.stressScore * 100).toFixed(
          0
        )}% stress score. `;
      }
    }

    if (
      lowerQuestion.includes("indicator") ||
      lowerQuestion.includes("cause") ||
      lowerQuestion.includes("reason")
    ) {
      response += `Stress indicators: ${stressAnalysis.stressByType.messageStress.toFixed(
        1
      )}% from stressful commit messages, ${stressAnalysis.stressByType.fileSpike.toFixed(
        1
      )}% from file count spikes, and ${stressAnalysis.stressByType.nightAggressive.toFixed(
        1
      )}% from night-time aggressive commits. `;
    }

    return response.trim();
  }

  // Default response
  const availableTopics = [
    "name",
    "bio",
    "location",
    "company",
    "repositories",
    "followers",
    "coding habits",
    "programming languages",
  ];
  if (stressAnalysis) {
    availableTopics.push("stress analysis", "panic detection");
  }
  return `I can help you learn about ${
    user.name || user.login
  }'s GitHub profile. You can ask about their ${availableTopics.join(", ")}.`;
}

export function GitHubChatbot({
  user,
  codingStats,
  topLanguages,
  stressAnalysis,
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
        ? `Hello! I can help you learn about ${
            user.name || user.login
          }'s GitHub profile. Ask me anything!`
        : "Hello! Please search for a GitHub user first, then I can help you learn about their profile.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState("");
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
          content: `Hello! I can help you learn about ${
            user.name || user.login
          }'s GitHub profile. Ask me anything!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [user]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(
        input,
        user,
        codingStats,
        topLanguages,
        stressAnalysis
      );
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
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
            <SheetTitle className="flex items-center gap-2">
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
            </SheetTitle>
            <SheetDescription>
              {user
                ? "Ask questions about the GitHub user's profile, repositories, coding habits, and stress analysis."
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
                  placeholder="Ask about the GitHub profile..."
                  className="flex-1"
                  disabled={!user}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || !user}
                  size="icon"
                >
                  <IconSend className="size-4" />
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
