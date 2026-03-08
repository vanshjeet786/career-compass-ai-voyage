import { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Download,
  ArrowRight,
  BarChart3,
  Compass,
  MessageSquare,
  Eye,
  Sparkles,
  Printer,
} from "lucide-react";
import { generatePDFReport } from "@/utils/pdfGenerator";
import { generateUserProfile, generateCareerRecommendations } from "@/utils/userProfile";
import { generateExecutiveSummary } from "@/utils/scoreHelpers";
import type { ResponseData } from "@/utils/userProfile";
import {
  LAYER_1_QUESTIONS,
  LAYER_2_QUESTIONS,
  LAYER_3_QUESTIONS,
  LAYER_4_QUESTIONS,
  LAYER_5_QUESTIONS,
} from "@/data/questions";

import ScoreGauge from "@/components/results/ScoreGauge";
import OverviewTab from "@/components/results/OverviewTab";
import ScoreBreakdown from "@/components/results/ScoreBreakdown";
import CareerPathsPanel from "@/components/results/CareerPathsPanel";
import AIChatPanel from "@/components/results/AIChatPanel";

type ResponseRow = {
  question_id: string;
  layer_number: number;
  response_value: any;
};

type AssessmentRecord = {
  id: string;
  background_info?: Record<string, unknown> | null;
};

interface AIResults {
  insights: string;
  recommendations: Array<{
    name: string;
    pros: string[];
    cons: string[];
    nextSteps: string[];
    layer6Match: string;
  }>;
  visualizationData: {
    labels: string[];
    baseScores: number[];
    enhancedScores: number[];
  };
  roadmap: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    fearsAddressed: string[];
  };
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Results = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const q = useQuery();
  const assessId = q.get("assess");

  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [aiResults, setAiResults] = useState<AIResults | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    document.title = "Career Compass — Your Career Blueprint";
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

  // Generate user profile from responses
  const userProfile = useMemo(() => {
    if (!rows.length || !assessId) return null;
    return generateUserProfile(rows as ResponseData[], assessId);
  }, [rows, assessId]);

  // Career recommendations
  const careerRecommendations = useMemo(() => {
    if (!userProfile) return [];
    return generateCareerRecommendations(userProfile);
  }, [userProfile]);

  // Scored categories for overview
  const scoredCategories = useMemo(() => {
    if (!userProfile) return [];
    const all = [
      ...Object.entries(userProfile.intelligenceScores),
      ...Object.entries(userProfile.personalityTraits),
      ...Object.entries(userProfile.aptitudes),
      ...Object.entries(userProfile.backgroundFactors),
      ...Object.entries(userProfile.interests),
    ]
      .filter(([, v]) => v > 0)
      .map(([name, score]) => ({ name, score: Number(score.toFixed(2)) }))
      .sort((a, b) => b.score - a.score);
    return all;
  }, [userProfile]);

  const overallScore = useMemo(() => {
    if (!userProfile) return 0;
    return userProfile.overallScores.totalScore;
  }, [userProfile]);

  const topStrengths = useMemo(() => scoredCategories.slice(0, 5), [scoredCategories]);
  const growthAreas = useMemo(
    () =>
      scoredCategories
        .filter((s) => s.score > 0)
        .slice(-3)
        .reverse(),
    [scoredCategories]
  );

  // Executive summary
  const executiveSummary = useMemo(() => {
    if (!userProfile || !careerRecommendations.length) return "";
    return generateExecutiveSummary(userProfile, careerRecommendations);
  }, [userProfile, careerRecommendations]);

  // Layer breakdowns for ScoreBreakdown component
  const layerBreakdowns = useMemo(() => {
    if (!userProfile) return [];

    const buildLayer = (
      name: string,
      num: number,
      desc: string,
      scores: Record<string, number>
    ) => ({
      layerName: name,
      layerNumber: num,
      description: desc,
      subScores: Object.entries(scores)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, score: Number(v.toFixed(2)) })),
      explanations: {},
    });

    return [
      buildLayer(
        "Layer 1: Intelligence Types",
        1,
        "How you naturally process information, solve problems, and make sense of the world.",
        userProfile.intelligenceScores
      ),
      buildLayer(
        "Layer 2: Personality Traits",
        2,
        "Your work style preferences, motivational drivers, and how you interact with others.",
        userProfile.personalityTraits
      ),
      buildLayer(
        "Layer 3: Aptitudes & Skills",
        3,
        "Your practical capabilities — the skills that translate directly into professional performance.",
        userProfile.aptitudes
      ),
      buildLayer(
        "Layer 4: Background & Context",
        4,
        "The educational, socioeconomic, and experiential factors that shape your career landscape.",
        userProfile.backgroundFactors
      ),
      buildLayer(
        "Layer 5: Interests & Values",
        5,
        "What energizes you, what you care about, and the direction your motivation naturally pulls.",
        userProfile.interests
      ),
    ];
  }, [userProfile]);

  // Quantitative scores for AI
  const quantitativeScores = useMemo(() => {
    const scores: Record<string, number> = {};
    scoredCategories.forEach((c) => {
      scores[c.name] = c.score;
    });
    return scores;
  }, [scoredCategories]);

  // Layer 6 responses for AI
  const layer6Responses = useMemo(
    () =>
      rows
        .filter((r) => r.layer_number === 6)
        .map((r) => ({
          question: r.question_id,
          response: r.response_value?.text || r.response_value?.label || "",
        })),
    [rows]
  );

  // Auto-load AI enhanced results on mount
  useEffect(() => {
    if (!assessId || !Object.keys(quantitativeScores).length || aiResults || aiLoading) return;

    const fetchAIResults = async () => {
      setAiLoading(true);
      const topStrStr = Object.entries(quantitativeScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([k, v]) => `${k}: ${v.toFixed(1)}/5`)
        .join(", ");

      const qualitativeText = layer6Responses
        .filter((r) => r.response?.trim())
        .map((r) => `Q: "${r.question}"\nA: "${r.response}"`)
        .join("\n\n");

      try {
        const { data, error: fnError } = await supabase.functions.invoke("gemini-assist", {
          body: {
            mode: "enhanced-results",
            context: {
              quantitativeScores,
              topStrengths: topStrStr,
              qualitativeText,
              backgroundInfo: assessment?.background_info,
              layer6Responses,
            },
          },
        });

        if (fnError) throw fnError;

        let parsed: AIResults;
        if (data?.toolResult) {
          parsed = data.toolResult;
        } else if (data?.generatedText) {
          const cleaned = data.generatedText
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .replace(/^```json\s*/, "")
            .replace(/\s*```$/, "")
            .trim();
          const match = cleaned.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : null;
        } else {
          throw new Error("No data returned");
        }

        if (!parsed) throw new Error("Failed to parse AI response");

        if (!parsed.roadmap) {
          parsed.roadmap = {
            shortTerm: ["Research your top 2-3 career matches in depth"],
            mediumTerm: ["Develop key skills through courses or projects"],
            longTerm: ["Build professional network in your target field"],
            fearsAddressed: ["Every career change starts with small exploratory steps"],
          };
        }

        setAiResults(parsed);
      } catch (err) {
        console.error("AI Enhanced error:", err);
        // Provide fallback so rest of page works
        setAiResults({
          insights: "",
          recommendations: [],
          visualizationData: {
            labels: Object.keys(quantitativeScores).slice(0, 6),
            baseScores: Object.values(quantitativeScores).slice(0, 6),
            enhancedScores: Object.values(quantitativeScores)
              .slice(0, 6)
              .map((s) => Math.min(s + 0.3, 5)),
          },
          roadmap: {
            shortTerm: ["Explore your top career matches", "Talk to professionals in these fields"],
            mediumTerm: ["Build key skills through courses or projects", "Gain relevant experience"],
            longTerm: ["Pursue your chosen career path with confidence"],
            fearsAddressed: ["Your profile shows strong potential — take it one step at a time"],
          },
        });
      } finally {
        setAiLoading(false);
      }
    };

    fetchAIResults();
  }, [assessId, quantitativeScores, layer6Responses, assessment, aiResults, aiLoading]);

  // Chat context
  const chatContext = useMemo(
    () => ({
      topStrengths: topStrengths.map((s) => `${s.name}: ${s.score}/5`).join(", "),
      developmentAreas: growthAreas.map((s) => `${s.name}: ${s.score}/5`).join(", "),
      overallScore,
      backgroundInfo: assessment?.background_info || {},
      layer6Insights: userProfile?.layer6Insights || {},
      careerRecommendations: careerRecommendations.slice(0, 3).map((c) => c.title),
    }),
    [topStrengths, growthAreas, overallScore, assessment, userProfile, careerRecommendations]
  );

  // Comparison data from AI
  const comparisonData = useMemo(() => {
    if (!aiResults?.visualizationData?.labels) return undefined;
    return aiResults.visualizationData.labels.map((label, i) => ({
      name: label,
      base: aiResults.visualizationData.baseScores[i] || 0,
      enhanced: aiResults.visualizationData.enhancedScores[i] || 0,
    }));
  }, [aiResults]);

  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
      await generatePDFReport("results-report", {
        userName: user?.email || "User",
        scores: quantitativeScores,
        insights: executiveSummary,
        topStrengths: topStrengths.map((i) => i.name),
      });
      toast({ title: "Report downloaded", description: "Your career blueprint PDF is ready." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Auto-redirect to latest completed assessment if no ID in URL
  useEffect(() => {
    if (assessId || !user || loading) return;
    (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1);
      if (data && data.length) {
        navigate(`/results?assess=${data[0].id}`, { replace: true });
      }
    })();
  }, [assessId, user, loading, navigate]);

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
            <CardTitle className="text-2xl">No completed assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Complete an assessment to see your career blueprint.</p>
            <Button asChild>
              <Link to="/background-info">Start Assessment</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const topCareer = careerRecommendations[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-16">
      <section className="container max-w-7xl py-10 space-y-6" id="results-report">
        {/* ─── Hero Header ─────────────────────────────────────────── */}
        <Card className="overflow-hidden border-primary/20 animate-fade-in">
          <div className="bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15 p-8 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="space-y-4 flex-1">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Career Blueprint
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Your Career Blueprint
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
                  {executiveSummary ||
                    "Your assessment tells a compelling story. Here's what we discovered about your potential, and where it could take you."}
                </p>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {topStrengths.length} Key Strengths
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {growthAreas.length} Growth Areas
                  </Badge>
                  {topCareer && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      Top Match: {topCareer.title} ({topCareer.compatibilityScore}%)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Score gauge */}
              <div className="flex flex-col items-center gap-3">
                <ScoreGauge value={overallScore} max={5} label="Profile Score" size="lg" />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print
                  </Button>
                  <Button size="sm" onClick={handleDownloadPDF} disabled={generatingPdf}>
                    {generatingPdf ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Main Tabs ───────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <Eye className="h-4 w-4" /> Your Profile
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Deep Dive
            </TabsTrigger>
            <TabsTrigger value="careers" className="gap-1.5">
              <Compass className="h-4 w-4" /> Your Careers
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Talk to AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              overallScore={overallScore}
              topStrengths={topStrengths}
              growthAreas={growthAreas}
              radarData={scoredCategories}
              careers={careerRecommendations}
              comparisonData={comparisonData}
              userProfile={userProfile}
            />
          </TabsContent>

          <TabsContent value="breakdown">
            <ScoreBreakdown layers={layerBreakdowns} />
          </TabsContent>

          <TabsContent value="careers">
            <CareerPathsPanel
              careers={careerRecommendations}
              userProfile={userProfile}
              aiRoadmap={aiResults?.roadmap}
              aiLoading={aiLoading}
              aiRecommendations={aiResults?.recommendations}
            />
          </TabsContent>

          <TabsContent value="chat">
            <AIChatPanel
              assessmentContext={chatContext}
              topStrengths={topStrengths}
              growthAreas={growthAreas}
              careers={careerRecommendations}
            />
          </TabsContent>
        </Tabs>

        {/* ─── Bottom Actions ──────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-6">
            <Button asChild variant="outline">
              <Link to="/assessment">
                Retake Assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Results;
