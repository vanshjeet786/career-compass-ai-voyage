
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Loader2, Download, TrendingUp, BarChart3, Activity, PieChart, Lightbulb, Target } from "lucide-react";
import { aiService } from "@/services/ai";
import { useAssessmentHistory } from "@/hooks/useAssessmentHistory";
import { generatePDFReport } from "@/utils/pdfGenerator";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Results = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const q = useQuery();
  const assessId = q.get("assess");
  
  const [activeTab, setActiveTab] = useState("overview");
  const [rows, setRows] = useState<any[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [aiEnhanced, setAiEnhanced] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const { assessments: history, getProgressAnalysis } = useAssessmentHistory();

  // Load Assessment Data
  useEffect(() => {
    if (!assessId) return;
    (async () => {
      // 1. Fetch metadata (background info, etc)
      const { data: assessData } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessId)
        .single();
      setAssessment(assessData);

      // 2. Fetch responses
      const { data, error } = await supabase
        .from("assessment_responses")
        .select("question_id, response_value, layer_number")
        .eq("assessment_id", assessId)
        .order("created_at", { ascending: true });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setRows(data || []);
      }
    })();
  }, [assessId]);

  // Calculate Scores
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

  // Generate AI Enhanced Results
  useEffect(() => {
    if (rows.length > 0 && assessment && !aiEnhanced && !aiLoading) {
      setAiLoading(true);
      const scores = catAverages.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.score }), {});

      // Filter for open-ended (Layer 6)
      const layer6 = rows
        .filter(r => r.layer_number === 6)
        .map(r => ({ question: r.question_id, response: r.response_value?.text || "" }));

      aiService.generateEnhancedResults(scores, layer6, assessment.background_info)
        .then(res => setAiEnhanced(res))
        .catch(err => console.error(err))
        .finally(() => setAiLoading(false));
    }
  }, [rows, assessment]);

  const progressAnalysis = useMemo(() => {
      if (!assessId || history.length < 2) return null;
      // Find the ID of the assessment we are viewing. If we are viewing the latest, it's easy.
      // But we might be viewing an old one.
      // Currently assuming we view the one from URL.
      return getProgressAnalysis(assessId); // This needs to be implemented in the hook to take an ID
  }, [assessId, history]);


  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
        await generatePDFReport('report-container', {
            userName: user?.email || "User", // Ideally full name
            scores: catAverages.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.score }), {}),
            insights: aiEnhanced?.insights || "Analysis pending...",
            topStrengths: catAverages.sort((a,b) => b.score - a.score).slice(0,3).map(c => c.name)
        });
        toast({ title: "Report Downloaded", description: "Your comprehensive career report is ready." });
    } catch (e) {
        toast({ title: "Download Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
        setGeneratingPdf(false);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container py-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Assessment Results</h1>
            <p className="text-muted-foreground mt-2">Comprehensive analysis of your career potential.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => window.print()} className="hidden md:flex">
                Print
             </Button>
             <Button onClick={handleDownloadPDF} disabled={generatingPdf} className="bg-primary">
                {generatingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                Download Report
             </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* REPORT CONTAINER FOR PDF */}
          <div id="report-container" ref={reportRef} className="space-y-8">

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">

                {/* AI Insights Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Lightbulb className="h-5 w-5"/> AI Executive Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {aiLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin"/> Analyzing your profile...
                            </div>
                        ) : (
                            <div className="prose text-gray-700 max-w-none">
                                {aiEnhanced?.insights ? (
                                    aiEnhanced.insights.split('\n').map((p: string, i: number) => <p key={i}>{p}</p>)
                                ) : (
                                    <p>No insights generated yet.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Strengths */}
                <div className="grid md:grid-cols-3 gap-6">
                    {catAverages.sort((a,b) => b.score - a.score).slice(0,3).map((cat, i) => (
                        <Card key={i} className="text-center hover:shadow-lg transition-all">
                            <CardHeader className="pb-2">
                                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                                    <Target className="h-6 w-6 text-primary"/>
                                </div>
                                <CardTitle className="text-lg">#{i+1} Strength</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{cat.name}</div>
                                <div className="text-muted-foreground">{cat.score.toFixed(1)}/5.0</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Charts */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader><CardTitle>Aptitude Profile</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={catAverages}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="name" tick={{fontSize: 10}} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                    <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={catAverages}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}}/>
                                    <YAxis domain={[0, 5]} />
                                    <Tooltip />
                                    <Bar dataKey="score" fill="#82ca9d" />
                                </BarChart>
                             </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Roadmap */}
                {aiEnhanced?.recommendations && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Recommended Career Paths</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {aiEnhanced.recommendations.map((rec: any, i: number) => (
                                <Card key={i} className="border-l-4 border-l-primary">
                                    <CardHeader>
                                        <CardTitle>{rec.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="text-sm font-semibold text-green-600">Why it fits:</div>
                                            <p className="text-sm text-gray-600">{rec.layer6Match}</p>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold">Next Steps:</div>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                                {rec.nextSteps?.map((step: string, j: number) => <li key={j}>{step}</li>)}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </TabsContent>

            {/* DETAILED ANALYSIS TAB */}
            <TabsContent value="detailed" className="space-y-6">
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5"/> Comprehensive Category Breakdown
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {catAverages.map((cat, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-1/3 text-sm font-medium">{cat.name}</div>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(cat.score / 5) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-12 text-sm font-bold text-right">{cat.score}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* PROGRESS TAB */}
            <TabsContent value="progress" className="space-y-6">
                 {history.length < 2 ? (
                     <Card className="text-center py-12">
                         <CardContent>
                             <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4"/>
                             <h3 className="text-lg font-medium">Not enough history</h3>
                             <p className="text-muted-foreground">Complete more assessments to see your progress over time.</p>
                         </CardContent>
                     </Card>
                 ) : (
                     <div className="space-y-6">
                         <Card>
                             <CardHeader><CardTitle>Growth Areas</CardTitle></CardHeader>
                             <CardContent>
                                 <p className="text-muted-foreground mb-4">Comparing to your last assessment on {new Date(history[1]?.completed_at).toLocaleDateString()}</p>
                                 {/* Progress implementation would go here - comparing scores */}
                                 <div className="text-sm text-gray-500">Feature pending full historical data integration.</div>
                             </CardContent>
                         </Card>
                     </div>
                 )}
            </TabsContent>
          </div>

        </Tabs>
      </div>
    </main>
  );
};

export default Results;
