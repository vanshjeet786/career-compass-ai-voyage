import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

interface AIChatPanelProps {
  assessmentContext: {
    topStrengths: string;
    developmentAreas: string;
    overallScore: number;
    backgroundInfo: any;
    layer6Insights: any;
    careerRecommendations: any[];
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-career-chat`;

const STARTER_QUESTIONS = [
  "What careers match my strengths?",
  "How can I improve my weak areas?",
  "What should I study next?",
  "Am I on the right career path?",
];

const AIChatPanel = ({ assessmentContext }: AIChatPanelProps) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, assessmentContext }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${resp.status}`);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) upsert(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Failed to get response";
      toast({ title: "Chat Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Talk to Your AI Career Counselor
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ask anything about your results, career options, or next steps. The AI has your full assessment data.
        </p>
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Sparkles className="h-10 w-10 text-primary/40" />
              <p className="text-sm text-muted-foreground max-w-sm">
                Start a conversation about your career direction. Here are some ideas:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTER_QUESTIONS.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => send(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input */}
      <div className="flex gap-2 mt-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about your career direction..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button onClick={() => send(input)} disabled={isLoading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AIChatPanel;
