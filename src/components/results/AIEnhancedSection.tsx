import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Sparkles,
  ChevronDown,
  Loader2,
  Brain,
  Target,
  Compass,
  TrendingUp,
  Lightbulb,
  Zap,
  Heart,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  AlertTriangle,
  Rocket,
} from "lucide-react";
import { getDisplayName } from "@/utils/categoryLabels";
import { getScoreBarHsl, generateCrossLayerInsights } from "@/utils/scoreHelpers";
import type { CrossLayerInsight } from "@/utils/scoreHelpers";
import type { UserProfile, CareerRecommendation } from "@/utils/userProfile";

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

interface ComparisonDatum {
  name: string;
  base: number;
  enhanced: number;
}

interface AIEnhancedSectionProps {
  aiResults: AIResults | null;
  aiLoading: boolean;
  comparisonData?: ComparisonDatum[];
  careers: CareerRecommendation[];
  scoredCategories: Array<{ name: string; score: number }>;
  userProfile: UserProfile | null;
}

const INSIGHT_ICONS: Record<CrossLayerInsight["icon"], React.ReactNode> = {
  brain: <Brain className="h-5 w-5 text-blue-500" />,
  heart: <Heart className="h-5 w-5 text-rose-500" />,
  target: <Target className="h-5 w-5 text-emerald-500" />,
  zap: <Zap className="h-5 w-5 text-amber-500" />,
  compass: <Compass className="h-5 w-5 text-purple-500" />,
  lightbulb: <Lightbulb className="h-5 w-5 text-orange-500" />,
};

function getCompatibilityColor(score: number): string {
  if (score >= 85) return "hsl(142, 71%, 45%)";
  if (score >= 70) return "hsl(162, 63%, 45%)";
  if (score >= 55) return "hsl(38, 92%, 50%)";
  return "hsl(25, 95%, 53%)";
}

const AIEnhancedSection = ({
  aiResults,
  aiLoading,
  comparisonData,
  careers,
  scoredCategories,
  userProfile,
}: AIEnhancedSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const crossLayerInsights = userProfile
    ? generateCrossLayerInsights(userProfile)
    : [];

  // Prepare radar chart data with display names
  const radarChartData = comparisonData?.map((d) => ({
    name:
      getDisplayName(d.name).length > 20
        ? getDisplayName(d.name).slice(0, 18) + "…"
        : getDisplayName(d.name),
    "Your Score": Number(d.base.toFixed(1)),
    "AI Enhanced": Number(d.enhanced.toFixed(1)),
  }));

  // Score deltas — categories where AI adjusted most
  const scoreDeltas = comparisonData
    ?.map((d) => ({
      name: getDisplayName(d.name),
      base: d.base,
      enhanced: d.enhanced,
      delta: Number((d.enhanced - d.base).toFixed(2)),
    }))
    .filter((d) => Math.abs(d.delta) > 0.1)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  // Career compatibility data for bar chart
  const careerBarData = careers.slice(0, 8).map((c) => ({
    name: c.title.length > 25 ? c.title.slice(0, 23) + "…" : c.title,
    fullName: c.title,
    score: c.compatibilityScore,
  }));

  // Skill gap analysis for top 3 careers
  const skillGaps = careers.slice(0, 3).map((career) => {
    const gaps: string[] = [];
    if (userProfile) {
      for (const skill of career.growthSkills?.slice(0, 3) || []) {
        gaps.push(skill);
      }
    }
    return { career: career.title, gaps, score: career.compatibilityScore };
  });

  const hasContent = aiResults || aiLoading;

  if (!hasContent) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={`overflow-hidden border-primary/20 transition-all duration-300 ${
          isOpen ? "shadow-lg" : "shadow-sm hover:shadow-md"
        }`}
      >
        {/* ─── Trigger Header ──────────────────────────────────── */}
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <div
              className={`bg-gradient-to-r from-primary/10 via-purple-500/8 to-secondary/10 p-6 md:p-8 transition-all duration-300 ${
                aiLoading ? "animate-magic-glow" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                    {aiLoading ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <Sparkles className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                        AI Enhanced Career Analysis
                      </h2>
                      <Badge
                        className="bg-primary/20 text-primary hover:bg-primary/20 text-xs shrink-0"
                      >
                        {aiLoading ? "Analyzing…" : "AI Powered"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Deep analysis combining all 6 assessment layers for personalized insights
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* ─── Collapsible Content ─────────────────────────────── */}
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          {aiLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Analyzing your assessment across all 6 layers…
              </p>
            </div>
          ) : aiResults ? (
            <div className="p-4 md:p-6 pt-2">
              <Tabs defaultValue="scores" className="space-y-6">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
                  <TabsTrigger value="scores" className="gap-1.5 text-xs sm:text-sm">
                    <BarChart3 className="h-3.5 w-3.5" /> Score Analysis
                  </TabsTrigger>
                  <TabsTrigger value="careers" className="gap-1.5 text-xs sm:text-sm">
                    <Target className="h-3.5 w-3.5" /> Career Fit
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="gap-1.5 text-xs sm:text-sm">
                    <Lightbulb className="h-3.5 w-3.5" /> Insights
                  </TabsTrigger>
                  <TabsTrigger value="roadmap" className="gap-1.5 text-xs sm:text-sm">
                    <Compass className="h-3.5 w-3.5" /> Your Roadmap
                  </TabsTrigger>
                </TabsList>

                {/* ── Score Analysis Tab ──────────────────────────── */}
                <TabsContent value="scores" className="space-y-6 mt-0">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Radar Chart */}
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-primary flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Enhanced Score Analysis
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          How AI adjusts your scores based on your open-ended
                          responses and background
                        </p>
                      </CardHeader>
                      <CardContent className="h-[340px]">
                        {radarChartData && radarChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarChartData}>
                              <PolarGrid stroke="hsl(var(--border))" />
                              <PolarAngleAxis
                                dataKey="name"
                                tick={{
                                  fontSize: 9,
                                  fill: "hsl(var(--muted-foreground))",
                                }}
                              />
                              <PolarRadiusAxis
                                angle={30}
                                domain={[0, 5]}
                                tick={{ fontSize: 8 }}
                              />
                              <Radar
                                name="Your Score"
                                dataKey="Your Score"
                                stroke="hsl(var(--muted-foreground))"
                                fill="hsl(var(--muted-foreground))"
                                fillOpacity={0.12}
                              />
                              <Radar
                                name="AI Enhanced"
                                dataKey="AI Enhanced"
                                stroke="hsl(142, 71%, 45%)"
                                fill="hsl(142, 71%, 45%)"
                                fillOpacity={0.2}
                                strokeWidth={2}
                              />
                              <Legend
                                wrapperStyle={{ fontSize: 11 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "8px",
                                  fontSize: 12,
                                }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full grid place-items-center text-sm text-muted-foreground">
                            No comparison data available.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Score Deltas */}
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-primary flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          AI Score Adjustments
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Categories where your open-ended responses revealed
                          hidden strengths
                        </p>
                      </CardHeader>
                      <CardContent>
                        {scoreDeltas && scoreDeltas.length > 0 ? (
                          <div className="space-y-3">
                            {scoreDeltas.map((d) => (
                              <div
                                key={d.name}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate block">
                                    {d.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {d.base.toFixed(1)} → {d.enhanced.toFixed(1)}
                                  </span>
                                </div>
                                <Badge
                                  variant={d.delta > 0 ? "default" : "secondary"}
                                  className={`shrink-0 ml-2 text-xs ${
                                    d.delta > 0
                                      ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/15"
                                      : ""
                                  }`}
                                >
                                  <ArrowUpRight
                                    className={`h-3 w-3 mr-0.5 ${
                                      d.delta < 0 ? "rotate-90" : ""
                                    }`}
                                  />
                                  {d.delta > 0 ? "+" : ""}
                                  {d.delta.toFixed(1)}
                                </Badge>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                              These adjustments reflect how your qualitative
                              responses and personal context enrich the
                              quantitative scores.
                            </p>
                          </div>
                        ) : (
                          <div className="h-40 grid place-items-center text-sm text-muted-foreground">
                            AI adjustments are minimal — your scores are
                            consistent across all layers.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* ── Career Fit Tab ──────────────────────────────── */}
                <TabsContent value="careers" className="space-y-6 mt-0">
                  {/* Career Compatibility Bar Chart */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-primary flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Career Compatibility Matrix
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Your top career matches ranked by overall fit
                      </p>
                    </CardHeader>
                    <CardContent
                      className="pr-2"
                      style={{
                        height: Math.max(280, careerBarData.length * 44),
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={careerBarData}
                          layout="vertical"
                          margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={170}
                            tick={{
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: 12,
                            }}
                            formatter={(value: number) => [
                              `${value}%`,
                              "Compatibility",
                            ]}
                            labelFormatter={(_, payload) =>
                              payload?.[0]?.payload?.fullName || ""
                            }
                          />
                          <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                            {careerBarData.map((entry, index) => (
                              <Cell
                                key={index}
                                fill={getCompatibilityColor(entry.score)}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Fit Factor Cards */}
                  {aiResults.recommendations &&
                    aiResults.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Why These Careers Fit You
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {aiResults.recommendations.slice(0, 3).map((rec, idx) => (
                            <Card
                              key={idx}
                              className="shadow-sm hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-semibold">
                                    {rec.name}
                                  </CardTitle>
                                  <Badge variant="outline" className="text-xs">
                                    #{idx + 1}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {rec.layer6Match && (
                                  <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-primary/30 pl-3">
                                    {rec.layer6Match}
                                  </p>
                                )}
                                <div className="space-y-1.5">
                                  {rec.pros?.slice(0, 3).map((pro, i) => (
                                    <div
                                      key={i}
                                      className="flex gap-1.5 text-xs"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0.5" />
                                      <span>{pro}</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                </TabsContent>

                {/* ── Insights Tab ────────────────────────────────── */}
                <TabsContent value="insights" className="space-y-6 mt-0">
                  {/* Cross-Layer Insights */}
                  {crossLayerInsights.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        How Your Traits Work Together
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {crossLayerInsights.map((insight, idx) => (
                          <Card
                            key={idx}
                            className="shadow-sm hover:shadow-md transition-shadow"
                          >
                            <CardContent className="pt-5">
                              <div className="flex gap-3">
                                <div className="shrink-0 mt-0.5">
                                  {INSIGHT_ICONS[insight.icon]}
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-1.5">
                                    {insight.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {insight.narrative}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill Gap Analysis */}
                  {skillGaps.length > 0 && skillGaps.some((s) => s.gaps.length > 0) && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Skills to Develop
                      </h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        {skillGaps.map(
                          (sg, idx) =>
                            sg.gaps.length > 0 && (
                              <Card key={idx} className="shadow-sm">
                                <CardContent className="pt-5">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold truncate mr-2">
                                      {sg.career}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className="text-xs shrink-0"
                                    >
                                      {sg.score}% match
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    {sg.gaps.map((gap, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2 text-xs text-muted-foreground"
                                      >
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                        {gap}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Narrative */}
                  {aiResults.insights && (
                    <Card className="shadow-sm border-primary/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-primary flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Comprehensive AI Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {aiResults.insights
                            .split("\n")
                            .filter((p) => p.trim())
                            .map((p, i) => (
                              <p
                                key={i}
                                className="text-sm leading-relaxed text-foreground/85 mb-3 last:mb-0"
                              >
                                {p}
                              </p>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ── Roadmap Tab ─────────────────────────────────── */}
                <TabsContent value="roadmap" className="space-y-4 mt-0">
                  {[
                    {
                      title: "Short Term",
                      subtitle: "0–3 months",
                      items: aiResults.roadmap?.shortTerm,
                      icon: <Rocket className="h-5 w-5 text-blue-500" />,
                      border: "border-l-blue-500",
                      bg: "bg-blue-500/5",
                    },
                    {
                      title: "Medium Term",
                      subtitle: "3–12 months",
                      items: aiResults.roadmap?.mediumTerm,
                      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
                      border: "border-l-purple-500",
                      bg: "bg-purple-500/5",
                    },
                    {
                      title: "Long Term",
                      subtitle: "1–3 years",
                      items: aiResults.roadmap?.longTerm,
                      icon: <Target className="h-5 w-5 text-emerald-500" />,
                      border: "border-l-emerald-500",
                      bg: "bg-emerald-500/5",
                    },
                  ].map((phase) => (
                    <Card
                      key={phase.title}
                      className={`shadow-sm border-l-4 ${phase.border}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          {phase.icon}
                          <div>
                            <CardTitle className="text-base">
                              {phase.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {phase.subtitle}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2.5">
                          {phase.items?.map((item, i) => (
                            <li key={i} className="flex gap-2.5 text-sm">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                              <span className="text-foreground/85">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}

                  {aiResults.roadmap?.fearsAddressed &&
                    aiResults.roadmap.fearsAddressed.length > 0 && (
                      <Card className="shadow-sm border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Heart className="h-4 w-4 text-rose-500" />
                            Addressing Your Concerns
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5">
                            {aiResults.roadmap.fearsAddressed.map((item, i) => (
                              <li
                                key={i}
                                className="text-sm text-foreground/80 leading-relaxed"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AIEnhancedSection;
