import { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import {
  Loader2,
  Download,
  Sparkles,
  TrendingUp,
  Compass,
  ArrowRight,
  Brain,
  Lightbulb,
  Target,
  CheckCircle2,
} from "lucide-react";
import { aiService } from "@/services/ai";
import { useAssessmentHistory } from "@/hooks/useAssessmentHistory";
import { generatePDFReport } from "@/utils/pdfGenerator";

type ResponseRow = {
  question_id: string;
  layer_number: number;
  response_value: {
    value?: number;
    text?: string;
    label?: string;
    customText?: string;
    career1?: string;
    career2?: string;
    career3?: string;
  };
};

type AssessmentRecord = {
  id: string;
  background_info?: Record<string, unknown> | null;
};

type Recommendation = {
  name?: string;
  nextSteps?: string[];
  layer6Match?: string;
  pros?: string[];
  cons?: string[];
};

type EnhancedResults = {
  insights?: string;
  recommendations?: Recommendation[];
  careerFitData?: { career: string; fitScore: number }[];
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Results = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const q = useQuery();
  const assessId = q.get("assess");

  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [aiEnhanced, setAiEnhanced] = useState<EnhancedResults | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { assessments: history } = useAssessmentHistory();

  useEffect(() => {
    document.title = "Career Compass Results — Your Career Blueprint";
  }, []);

  useEffect(() => {
    if (!assessId) return;
    (async () => {
      const { data: assessData, error: assessError } = await supabase
        .from("assessments")
        .select("id, background_info")
        .eq("id", assessId)
        .single();

      if (assessError) {
        toast({ title: "Error", description: assessError.message, variant: "destructive" });
        return;
      }

      setAssessment(assessData as AssessmentRecord);

      const { data, error } = await supabase
        .from("assessment_responses")
        .select("question_id, response_value, layer_number")
        .eq("assessment_id", assessId)
        .order("created_at", { ascending: true });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setRows((data || []) as ResponseRow[]);
      }
    })();
  }, [assessId, toast]);

  const scoredCategories = useMemo(() => {
    const aggregate: Record<string, { sum: number; count: number }> = {};

    for (const row of rows) {
      const value = row.response_value?.value;
      if (typeof value !== "number") continue;

      const categoryKey = row.question_id.split(":")[0] || row.question_id;
      if (!aggregate[categoryKey]) aggregate[categoryKey] = { sum: 0, count: 0 };
      aggregate[categoryKey].sum += value;
      aggregate[categoryKey].count += 1;
    }

    return Object.entries(aggregate)
      .map(([name, data]) => ({ name, score: Number((data.sum / data.count).toFixed(2)) }))
      .sort((a, b) => b.score - a.score);
  }, [rows]);

  const overallScore = useMemo(() => {
    if (scoredCategories.length === 0) return 0;
    const total = scoredCategories.reduce((acc, item) => acc + item.score, 0);
    return Number((total / scoredCategories.length).toFixed(2));
  }, [scoredCategories]);

  const topStrengths = useMemo(() => scoredCategories.slice(0, 3), [scoredCategories]);
  const growthThemes = useMemo(() => scoredCategories.slice(-3).reverse(), [scoredCategories]);

  useEffect(() => {
    if (rows.length === 0 || !assessment || aiEnhanced || aiLoading) return;

    setAiLoading(true);
    const scores = scoredCategories.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.score }), {} as Record<string, number>);

    const layer6Responses = rows
      .filter((row) => row.layer_number === 6)
      .map((row) => ({ question: row.question_id, response: row.response_value?.text || "" }));

    aiService
      .generateEnhancedResults(scores, layer6Responses, assessment.background_info)
      .then((res) => setAiEnhanced(res as EnhancedResults))
      .catch((err) => {
        console.error(err);
        toast({
          title: "AI insight unavailable",
          description: "We couldn't generate enhanced interpretation right now.",
          variant: "destructive",
        });
      })
      .finally(() => setAiLoading(false));
  }, [rows, assessment, aiEnhanced, aiLoading, scoredCategories, toast]);

  const careerMatches = useMemo(() => {
    if (aiEnhanced?.careerFitData?.length) {
      return [...aiEnhanced.careerFitData]
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 5)
        .map((item) => ({ name: item.career, fitScore: Number(item.fitScore.toFixed(1)) }));
    }

    if (aiEnhanced?.recommendations?.length) {
      return aiEnhanced.recommendations.slice(0, 5).map((rec, idx) => ({
        name: rec.name || `Career Path ${idx + 1}`,
        fitScore: Number((4.6 - idx * 0.2).toFixed(1)),
      }));
    }

    return [];
  }, [aiEnhanced]);

  const recentComparisonText = useMemo(() => {
    if (!assessId || history.length < 2) return "Complete another assessment to unlock trend comparisons.";
    const completed = history[1]?.completed_at;
    if (!completed) return "Historical comparison will be available after your next completed assessment.";
    return `Your profile can now be compared against your previous run from ${new Date(completed).toLocaleDateString()}.`;
  }, [assessId, history]);

  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
      await generatePDFReport("results-report", {
        userName: user?.email || "User",
        scores: scoredCategories.reduce((acc, item) => ({ ...acc, [item.name]: item.score }), {} as Record<string, number>),
        insights: aiEnhanced?.insights || "Your interpretation is being generated.",
        topStrengths: topStrengths.map((item) => item.name),
      });

      toast({ title: "Report downloaded", description: "Your career blueprint PDF is ready." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!assessId) {
    return (
      <main className="min-h-screen grid place-items-center px-4 text-center">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-2xl">No assessment selected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">We could not find an assessment id in the URL.</p>
            <Button asChild>
              <Link to="/assessment">Go to Assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-16">
      <section className="container max-w-7xl py-10 space-y-8" id="results-report">
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15 p-8 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Career Blueprint</Badge>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Your Results Interpretation</h1>
                <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
                  We translated your full assessment into a practical career narrative so you can focus on decisions, not raw scores.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => window.print()}>
                  Print
                </Button>
                <Button onClick={handleDownloadPDF} disabled={generatingPdf}>
                  {generatingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-background/70">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Overall Alignment</div>
                  <div className="text-3xl font-bold">{overallScore ? `${overallScore}/5` : "—"}</div>
                </CardContent>
              </Card>
              <Card className="bg-background/70">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Strength Themes</div>
                  <div className="text-3xl font-bold">{topStrengths.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-background/70">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Career Matches</div>
                  <div className="text-3xl font-bold">{careerMatches.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-background/70">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Trend Tracking</div>
                  <div className="text-sm font-medium">{history.length > 1 ? "Available" : "Awaiting 2nd run"}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Executive Interpretation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building your interpretation...
                </div>
              ) : (
                <div className="space-y-4">
                  {(aiEnhanced?.insights || "Your profile signals broad potential. Keep building clarity by validating roles through projects, conversations, and short experiments.")
                    .split("\n")
                    .filter((p) => p.trim())
                    .map((paragraph, idx) => (
                      <p key={idx} className="text-sm md:text-base leading-relaxed text-foreground/90">
                        {paragraph}
                      </p>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Next Best Moves
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(aiEnhanced?.recommendations?.[0]?.nextSteps?.slice(0, 4) || [
                "Shortlist 2-3 roles that match your strengths.",
                "Speak with one mentor or practitioner in each role.",
                "Run one 2-week skill experiment to test fit.",
                "Review and refine your learning plan monthly.",
              ]).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  <span>{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Strength Profile (Theme-level)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              {scoredCategories.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={scoredCategories.slice(0, 8)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={20} domain={[0, 5]} />
                    <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  Complete the assessment to view your interpreted profile.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                Career Match Confidence
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              {careerMatches.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={careerMatches} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="fitScore" fill="#14b8a6" radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  AI recommendations will appear here once interpretation is available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                High-Leverage Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topStrengths.length ? (
                topStrengths.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.score}/5</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-2 bg-primary rounded-full" style={{ width: `${(item.score / 5) * 100}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No scored themes yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Development Priorities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {growthThemes.length ? (
                growthThemes.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.score}/5</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-2 bg-accent rounded-full" style={{ width: `${(item.score / 5) * 100}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No scored themes yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold">Progress & Reflection</h2>
              <Badge variant="outline">Interpretation-first experience</Badge>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">{recentComparisonText}</p>
            <div className="flex gap-3 flex-wrap">
              <Button asChild variant="outline">
                <Link to="/assessment">
                  Retake Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link to="/profile">Update Profile Context</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Results;
