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
import { Loader2, Download, Send, ExternalLink, TrendingUp, DollarSign, Users } from "lucide-react";
import { generateCareerRecommendations, type CareerRecommendation } from "@/data/careerRecommendations";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type ResponseValue = { label: string; value: number } | { text: string };

interface RespRow {
  question_id: string;
  response_value: ResponseValue;
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

  // SEO: title, description, canonical
  useEffect(() => {
    document.title = "Career Compass Results - Insights & PDF";
    const metaDesc = "View your Career Compass results, insights, and download your PDF report.";
    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.name = 'description';
      document.head.appendChild(descTag);
    }
    descTag.content = metaDesc;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + '/results';
  }, []);

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
        setRows(data?.map(row => ({
          ...row,
          response_value: row.response_value as ResponseValue
        })) || []);
      }
    })();
  }, [assessId, toast]);

  const catAverages = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    for (const r of rows) {
      if (r.response_value && 'value' in r.response_value && typeof r.response_value.value === "number") {
        const cat = r.question_id.split(":")[0] || r.question_id;
        if (!map[cat]) map[cat] = { sum: 0, count: 0 };
        map[cat].sum += r.response_value.value;
        map[cat].count += 1;
      }
    }
    return Object.entries(map).map(([name, v]) => ({ name, score: Number((v.sum / v.count).toFixed(2)) }));
  }, [rows]);

  const careerRecommendations = useMemo(() => {
    if (!catAverages.length) return [];
    return generateCareerRecommendations(rows, catAverages);
  }, [rows, catAverages]);

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ title: "PDF error", description: message, variant: "destructive" });
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
      // Get user's assessment responses for context
      const { data: responsesData } = await supabase
        .from("assessment_responses")
        .select("question_id, response_value, layer_number")
        .eq("assessment_id", assessId);
      
      // Create a summary of the user's responses for better context
      const context = {
        assessId,
        catAverages,
        responses: responsesData || []
      };
      
      const { data, error } = await supabase.functions.invoke("gemini-assist", {
        body: { mode: "chat", prompt: userMsg.text, context },
      });
      if (error) throw error;
      setChat((c) => [...c, { from: "ai", text: data.text }]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unknown error occurred.";
      toast({ title: "Chat error", description: message, variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-fade-in">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              ✨ Assessment Complete
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
              Your Career Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Comprehensive analysis of your strengths, preferences, and career potential
            </p>
          </div>
          <Button 
            onClick={exportPDF} 
            disabled={generating}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover-scale"
          >
            {generating ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            Download Report
          </Button>
        </div>

        <div ref={pdfRef} className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="animate-fade-in border-0 shadow-xl bg-card/50 backdrop-blur-sm" style={{ animationDelay: '100ms' }}>
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
                  Intelligence & Aptitude Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8" style={{ height: 480 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catAverages} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      angle={-20} 
                      textAnchor="end" 
                      height={80} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="score" 
                      fill="url(#barGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-0 shadow-xl bg-card/50 backdrop-blur-sm" style={{ animationDelay: '200ms' }}>
              <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 border-b">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-accent to-primary" />
                  Strengths Radar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8" style={{ height: 480 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={catAverages} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <PolarRadiusAxis 
                      domain={[1, 5]} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Career Recommendations Section */}
          <Card className="animate-fade-in border-0 shadow-xl bg-card/50 backdrop-blur-sm" style={{ animationDelay: '300ms' }}>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
                Top Career Recommendations
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Based on your assessment results, here are careers that align with your strengths and interests
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6">
                {careerRecommendations.map((career, index) => (
                  <div key={career.title} className="border border-border/50 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-background/50">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                            #{index + 1}
                          </div>
                          <h3 className="text-xl font-semibold">{career.title}</h3>
                          <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {career.compatibility}% Match
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">{career.explanation}</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <DollarSign className="h-4 w-4 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Salary Range</p>
                          <p className="font-medium text-sm">{career.salaryRange}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Growth Outlook</p>
                          <p className="font-medium text-sm">{career.growthOutlook}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                        <Users className="h-4 w-4 text-secondary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Matching Factors</p>
                          <p className="font-medium text-sm">{career.matchingFactors.length} strengths</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {career.keySkills.slice(0, 4).map(skill => (
                          <span key={skill} className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                            {skill}
                          </span>
                        ))}
                        {career.keySkills.length > 4 && (
                          <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                            +{career.keySkills.length - 4} more
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(career.onetLink, '_blank')}
                        className="hover:bg-primary/10 hover:border-primary/20"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View O*NET
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid xl:grid-cols-3 gap-8">
            <Card className="xl:col-span-2 animate-fade-in border-0 shadow-xl bg-card/50 backdrop-blur-sm" style={{ animationDelay: '400ms' }}>
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
                  Recommendations & Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Top Strengths</h3>
                    <div className="space-y-3">
                      {catAverages.sort((a, b) => b.score - a.score).slice(0, 3).map((cat, idx) => (
                        <div key={cat.name} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{cat.name}</p>
                            <p className="text-sm text-muted-foreground">Score: {cat.score}/5</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-accent">Action Items</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                        <span className="text-sm">Focus on top-scoring categories for skill development</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                        <span className="text-sm">Align projects with your highest strengths</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                        <span className="text-sm">Validate career choices through micro-experiments</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="animate-fade-in border-0 shadow-xl bg-card/50 backdrop-blur-sm" style={{ animationDelay: '500ms' }}>
              <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 border-b">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-accent to-primary" />
                  AI Career Counselor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 overflow-y-auto border rounded-lg p-4 mb-4 space-y-3 bg-background/50 backdrop-blur-sm">
                  {chat.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">🤖</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Ask me anything about your results, career paths, or next steps!</p>
                    </div>
                  )}
                  {chat.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.from === "ai" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        m.from === "ai" 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "bg-accent/10 text-accent border border-accent/20"
                      }`}>
                        <div className="text-xs font-semibold mb-1 opacity-60">
                          {m.from === "ai" ? "AI Counselor" : "You"}
                        </div>
                        <div className="text-sm">{m.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    placeholder="Ask about your career path..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                  />
                  <Button 
                    onClick={sendChat}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Results;
