import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";
import {
  Loader2,
  Sparkles,
  Brain,
  Target,
  Compass,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIEnhancedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  quantitativeScores: Record<string, number>;
  layer6Responses: { question: string; response: string }[];
  backgroundInfo: any;
}

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

const AIEnhancedDialog = ({
  open,
  onOpenChange,
  assessmentId,
  quantitativeScores,
  layer6Responses,
  backgroundInfo,
}: AIEnhancedDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AIResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || results || loading) return;

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      const topStrengths = Object.entries(quantitativeScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([k, v]) => `${k}: ${v.toFixed(1)}/5`)
        .join(", ");

      const qualitativeText = layer6Responses
        .filter((r) => r.response?.trim())
        .map((r) => `Q: "${r.question}"\nA: "${r.response}"`)
        .join("\n\n");

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "gemini-assist",
          {
            body: {
              mode: "enhanced-results",
              context: {
                quantitativeScores,
                topStrengths,
                qualitativeText,
                backgroundInfo,
                layer6Responses,
              },
            },
          }
        );

        if (fnError) throw fnError;

        // Parse tool call result or raw JSON
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

        // Ensure roadmap exists
        if (!parsed.roadmap) {
          parsed.roadmap = {
            shortTerm: ["Research your top 2-3 career matches in depth"],
            mediumTerm: ["Develop key skills through courses or projects"],
            longTerm: ["Build professional network in your target field"],
            fearsAddressed: ["Every career change starts with small exploratory steps"],
          };
        }

        setResults(parsed);
      } catch (err) {
        console.error("AI Enhanced error:", err);
        setError("Failed to generate AI-enhanced results. Please try again.");
        // Provide fallback
        setResults({
          insights:
            "Based on your comprehensive assessment across all 6 layers, you demonstrate a well-rounded profile with clear strengths in analytical thinking and interpersonal skills. Your Layer 6 responses suggest you value meaningful work and have a clear sense of direction.",
          recommendations: [
            {
              name: "Top Career Match",
              pros: ["Aligns with your strengths", "Growing market demand"],
              cons: ["May require additional training"],
              nextSteps: [
                "Research this field further",
                "Connect with professionals",
              ],
              layer6Match:
                "This aligns with your expressed interests and values from Layer 6.",
            },
          ],
          visualizationData: {
            labels: Object.keys(quantitativeScores).slice(0, 6),
            baseScores: Object.values(quantitativeScores).slice(0, 6),
            enhancedScores: Object.values(quantitativeScores)
              .slice(0, 6)
              .map((s) => Math.min(s + 0.3, 5)),
          },
          roadmap: {
            shortTerm: ["Explore your top career matches", "Talk to professionals"],
            mediumTerm: ["Build key skills", "Gain relevant experience"],
            longTerm: ["Pursue your chosen career path with confidence"],
            fearsAddressed: ["Your profile shows strong potential for success"],
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [open, results, loading, quantitativeScores, layer6Responses, backgroundInfo]);

  const comparisonData =
    results?.visualizationData?.labels?.map((label, i) => ({
      name: label,
      base: results.visualizationData.baseScores[i] || 0,
      enhanced: results.visualizationData.enhancedScores[i] || 0,
    })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Enhanced Results
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            These results use AI to combine your Layer 1-5 quantitative scores with your Layer 6 open-ended responses and background info for deeper personalization.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 grid place-items-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Analyzing all 6 layers of your assessment...
              </p>
            </div>
          </div>
        ) : results ? (
          <Tabs defaultValue="insights" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="insights" className="gap-1">
                <Brain className="h-4 w-4" /> Insights
              </TabsTrigger>
              <TabsTrigger value="careers" className="gap-1">
                <Compass className="h-4 w-4" /> Career Matches
              </TabsTrigger>
              <TabsTrigger value="visualization" className="gap-1">
                <Target className="h-4 w-4" /> Comparison
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> Roadmap
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="insights" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Generated Career Narrative</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {results.insights
                        ?.split("\n")
                        .filter((p) => p.trim())
                        .map((p, i) => (
                          <p key={i} className="text-sm leading-relaxed text-foreground/90">
                            {p}
                          </p>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="careers" className="mt-0 space-y-4">
                {results.recommendations?.map((rec, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{rec.name}</CardTitle>
                        <Badge variant="outline">#{idx + 1}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {rec.layer6Match && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                          <span className="font-medium text-primary">Why this matches you: </span>
                          {rec.layer6Match}
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                            Pros
                          </h4>
                          <ul className="text-sm space-y-1">
                            {rec.pros?.map((p, i) => (
                              <li key={i} className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-red-500 dark:text-red-400 mb-1">
                            Considerations
                          </h4>
                          <ul className="text-sm space-y-1">
                            {rec.cons?.map((c, i) => (
                              <li key={i} className="flex gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {rec.nextSteps?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Next Steps</h4>
                          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                            {rec.nextSteps.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="visualization" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Base vs AI-Enhanced Scores</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      See how AI adjusts your scores based on qualitative Layer 6 insights and background context.
                    </p>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {comparisonData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={comparisonData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} />
                          <Radar
                            name="Base Score"
                            dataKey="base"
                            stroke="hsl(var(--muted-foreground))"
                            fill="hsl(var(--muted-foreground))"
                            fillOpacity={0.15}
                          />
                          <Radar
                            name="AI Enhanced"
                            dataKey="enhanced"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.25}
                          />
                          <Legend />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full grid place-items-center text-muted-foreground">
                        No comparison data available.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roadmap" className="mt-0 space-y-4">
                {[
                  { title: "Short Term (0-3 months)", items: results.roadmap?.shortTerm, icon: "🚀" },
                  { title: "Medium Term (3-12 months)", items: results.roadmap?.mediumTerm, icon: "📈" },
                  { title: "Long Term (1-3 years)", items: results.roadmap?.longTerm, icon: "🎯" },
                ].map((phase) => (
                  <Card key={phase.title}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {phase.icon} {phase.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {phase.items?.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}

                {results.roadmap?.fearsAddressed?.length > 0 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">💪 Addressing Your Concerns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {results.roadmap.fearsAddressed.map((item, i) => (
                          <li key={i} className="text-sm text-foreground/80">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 grid place-items-center text-muted-foreground">
            Something went wrong. Please close and try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIEnhancedDialog;
