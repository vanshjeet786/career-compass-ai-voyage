import { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Download, ArrowRight, BarChart3, Compass, MessageSquare, Eye } from "lucide-react";
import { generatePDFReport } from "@/utils/pdfGenerator";
import { generateUserProfile, generateCareerRecommendations } from "@/utils/userProfile";
import type { ResponseData } from "@/utils/userProfile";
import {
  LAYER_1_QUESTIONS,
  LAYER_2_QUESTIONS,
  LAYER_3_QUESTIONS,
  LAYER_4_QUESTIONS,
  LAYER_5_QUESTIONS,
} from "@/data/questions";

import OverviewTab from "@/components/results/OverviewTab";
import ScoreBreakdown from "@/components/results/ScoreBreakdown";
import CareerPathsPanel from "@/components/results/CareerPathsPanel";
import AIChatPanel from "@/components/results/AIChatPanel";
import AIEnhancedDialog from "@/components/results/AIEnhancedDialog";

type ResponseRow = {
  question_id: string;
  layer_number: number;
  response_value: any;
};

type AssessmentRecord = {
  id: string;
  background_info?: Record<string, unknown> | null;
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

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

  // Generate user profile from responses
  const userProfile = useMemo(() => {
    if (!rows.length || !assessId) return null;
    return generateUserProfile(rows as ResponseData[], assessId);
  }, [rows, assessId]);

  // Career recommendations (quantitative only)
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
        "Measures your multiple intelligences based on Howard Gardner's theory — linguistic, logical-mathematical, spatial, musical, and more.",
        userProfile.intelligenceScores
      ),
      buildLayer(
        "Layer 2: Personality Traits",
        2,
        "Assesses your personality using MBTI preferences, Big Five traits, and Self-Determination Theory motivations.",
        userProfile.personalityTraits
      ),
      buildLayer(
        "Layer 3: Aptitudes & Skills",
        3,
        "Evaluates your practical aptitudes including numerical, verbal, abstract reasoning, technical, creative, and communication skills.",
        userProfile.aptitudes
      ),
      buildLayer(
        "Layer 4: Background & Context",
        4,
        "Considers your educational background, socioeconomic factors, and career exposure that shape your opportunities.",
        userProfile.backgroundFactors
      ),
      buildLayer(
        "Layer 5: Interests & Values",
        5,
        "Explores your interests, passions, career trend awareness, and personal goals and values.",
        userProfile.interests
      ),
    ];
  }, [userProfile]);

  // Quantitative scores for AI Enhanced
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

  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
      await generatePDFReport("results-report", {
        userName: user?.email || "User",
        scores: quantitativeScores,
        insights: "Your comprehensive career assessment results.",
        topStrengths: topStrengths.map((i) => i.name),
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
      <section className="container max-w-7xl py-10 space-y-6" id="results-report">
        {/* Header */}
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15 p-8 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-3">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                  Career Blueprint
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Your Assessment Results
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                  Explore your strengths, discover career paths, and get AI-powered insights — all
                  based on your comprehensive 6-layer assessment.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => window.print()}>
                  Print
                </Button>
                <Button onClick={handleDownloadPDF} disabled={generatingPdf}>
                  {generatingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <Eye className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Score Breakdown
            </TabsTrigger>
            <TabsTrigger value="careers" className="gap-1.5">
              <Compass className="h-4 w-4" /> Career Paths
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
              onOpenAIEnhanced={() => setAiDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="breakdown">
            <ScoreBreakdown layers={layerBreakdowns} />
          </TabsContent>

          <TabsContent value="careers">
            <CareerPathsPanel careers={careerRecommendations} />
          </TabsContent>

          <TabsContent value="chat">
            <AIChatPanel assessmentContext={chatContext} />
          </TabsContent>
        </Tabs>

        {/* Bottom actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3 flex-wrap">
              <Button asChild variant="outline">
                <Link to="/assessment">
                  Retake Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link to="/profile">Update Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* AI Enhanced Dialog */}
      <AIEnhancedDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        assessmentId={assessId}
        quantitativeScores={quantitativeScores}
        layer6Responses={layer6Responses}
        backgroundInfo={assessment?.background_info}
      />
    </main>
  );
};

export default Results;
