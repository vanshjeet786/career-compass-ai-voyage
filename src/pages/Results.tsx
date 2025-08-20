import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Loader2, Download, Send } from "lucide-react";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

interface RespRow {
  question_id: string;
  response_value: any;
  layer_number: number;
}

const Results = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const q = useQuery();
  const assessId = q.get("assess");
  const [rows, setRows] = useState<RespRow[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<{ from: "user" | "ai"; text: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assessId) return;
    (async () => {
      const { data, error } = await supabase
        .from("assessment_responses")
        .select("question_id, response_value, layer_number")
        .eq("assessment_id", assessId)
        .order("created_at", { ascending: true });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setRows((data as any) || []);
      }
    })();
  }, [assessId]);

  const catAverages = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    for (const r of rows) {
      if (typeof r.response_value?.value === "number") {
        const cat = r.question_id.split(":")[0] || r.question_id;
        if (!map[cat]) map[cat] = { sum: 0, count: 0 };
        map[cat].sum += r.response_value.value;
        map[cat].count += 1;
      }
    }
    return Object.entries(map).map(([name, v]) => ({ name, score: Number((v.sum / v.count).toFixed(2)) }));
  }, [rows]);

  const exportPDF = async () => {
    if (!pdfRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 20, 20, imgWidth, Math.min(imgHeight, pageHeight - 40));
      pdf.save("career-compass-report.pdf");
    } catch (e: any) {
      toast({ title: "PDF error", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { from: "user" as const, text: chatInput };
    setChat((c) => [...c, userMsg]);
    setChatInput("");
    try {
      const { data, error } = await supabase.functions.invoke("hf-assist", {
        body: { mode: "chat", prompt: userMsg.text, context: { assessId, catAverages } },
      });
      if (error) throw error;
      setChat((c) => [...c, { from: "ai", text: data.text }]);
    } catch (e: any) {
      toast({ title: "Chat error", description: e.message ?? String(e), variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <main className="min-h-screen container py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Your Results</h1>
          <p className="text-muted-foreground">Insightful analysis across all layers</p>
        </div>
        <Button onClick={exportPDF} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Download PDF
        </Button>
      </div>

      <div ref={pdfRef} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Intelligence & Aptitude Overview</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={70} />
                <YAxis domain={[1, 5]} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Strengths Radar</CardTitle></CardHeader>
          <CardContent style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={catAverages}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis domain={[1, 5]} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent))" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Recommendations & Insights</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>Focus on top-scoring categories for near-term skill development.</li>
                <li>Align projects and internships with 1-2 highest strengths.</li>
                <li>Use the action plan to validate choices via micro-experiments.</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Career Counselor Chatbot</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56 overflow-y-auto border rounded-md p-3 mb-3 space-y-2 bg-background/50">
                {chat.length === 0 && (
                  <div className="text-sm text-muted-foreground">Ask me anything about your results, careers, or next steps.</div>
                )}
                {chat.map((m, i) => (
                  <div key={i} className={m.from === "ai" ? "text-sm" : "text-sm text-foreground"}>
                    <span className="font-semibold">{m.from === "ai" ? "Counselor" : "You"}:</span> {m.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your question..." />
                <Button onClick={sendChat}><Send className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default Results;
