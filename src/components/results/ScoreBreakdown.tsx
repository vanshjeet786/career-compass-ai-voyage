import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Brain,
  Heart,
  Wrench,
  GraduationCap,
  Compass,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import {
  getScoreColor,
  getScoreBarHsl,
  getScoreTier,
  getScoreInterpretation,
  getLayerNarrative,
  getCareerRelevanceForCategory,
} from "@/utils/scoreHelpers";
import { getDisplayName } from "@/utils/categoryLabels";

interface SubScore {
  name: string;
  score: number;
}

interface LayerBreakdown {
  layerName: string;
  layerNumber: number;
  description: string;
  subScores: SubScore[];
  explanations: Record<string, { high: string; low: string }>;
}

interface ScoreBreakdownProps {
  layers: LayerBreakdown[];
}

const LAYER_THEME: Record<number, { border: string; icon: React.ReactNode; bg: string }> = {
  1: { border: "border-l-blue-500", icon: <Brain className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/5" },
  2: { border: "border-l-purple-500", icon: <Heart className="h-4 w-4 text-purple-500" />, bg: "bg-purple-500/5" },
  3: { border: "border-l-emerald-500", icon: <Wrench className="h-4 w-4 text-emerald-500" />, bg: "bg-emerald-500/5" },
  4: { border: "border-l-amber-500", icon: <GraduationCap className="h-4 w-4 text-amber-500" />, bg: "bg-amber-500/5" },
  5: { border: "border-l-rose-500", icon: <Compass className="h-4 w-4 text-rose-500" />, bg: "bg-rose-500/5" },
};

const ScoreBreakdown = ({ layers }: ScoreBreakdownProps) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">The Deep Dive</h2>
        <p className="text-sm text-muted-foreground mt-1">
          A detailed look at what makes your profile unique — and how each dimension connects to your career potential.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["layer-1"]} className="space-y-4">
        {layers.map((layer) => {
          const avgScore =
            layer.subScores.length > 0
              ? layer.subScores.reduce((s, i) => s + i.score, 0) / layer.subScores.length
              : 0;

          const theme = LAYER_THEME[layer.layerNumber] || LAYER_THEME[1];
          const narrative = getLayerNarrative(layer.layerName, layer.subScores);
          const chartHeight = Math.max(200, layer.subScores.length * 36);

          return (
            <AccordionItem
              key={layer.layerNumber}
              value={`layer-${layer.layerNumber}`}
              className={`border rounded-lg px-4 border-l-4 ${theme.border}`}
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  {theme.icon}
                  <Badge variant="outline" className="text-xs shrink-0">
                    L{layer.layerNumber}
                  </Badge>
                  <div>
                    <span className="font-semibold">{layer.layerName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Avg: {avgScore.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {/* Dynamic narrative */}
                <div className={`p-3 rounded-lg ${theme.bg} mb-4`}>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {narrative || layer.description}
                  </p>
                </div>

                {/* Bar chart */}
                {layer.subScores.length > 0 && (
                  <div style={{ height: chartHeight }} className="mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={layer.subScores.map((s) => ({
                          ...s,
                          displayName: getDisplayName(s.name),
                        }))}
                        layout="vertical"
                        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                        <YAxis
                          dataKey="displayName"
                          type="category"
                          width={170}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value.toFixed(2)}/5`, "Score"]}
                        />
                        <ReferenceLine
                          x={avgScore}
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="4 4"
                          strokeOpacity={0.5}
                          label={{
                            value: `Avg: ${avgScore.toFixed(1)}`,
                            fontSize: 10,
                            fill: "hsl(var(--muted-foreground))",
                            position: "top",
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                          {layer.subScores.map((entry, index) => (
                            <Cell key={index} fill={getScoreBarHsl(entry.score)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Sub-score cards */}
                <div className="space-y-2">
                  {layer.subScores.map((sub) => {
                    const tier = getScoreTier(sub.score);
                    const colors = getScoreColor(sub.score);
                    const cardKey = `${layer.layerNumber}-${sub.name}`;
                    const isExpanded = expandedCards[cardKey];
                    const relevantCareers = getCareerRelevanceForCategory(sub.name);

                    return (
                      <div
                        key={sub.name}
                        className={`rounded-lg border border-border/50 transition-colors ${
                          isExpanded ? theme.bg : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <button
                          onClick={() => toggleCard(cardKey)}
                          className="w-full p-3 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{getDisplayName(sub.name)}</span>
                            <Badge
                              variant={sub.score >= 4 ? "default" : sub.score >= 3 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {sub.score.toFixed(1)}/5
                            </Badge>
                            <span className={`text-xs ${colors.text}`}>{tier.label}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2 animate-fade-in">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {getScoreInterpretation(sub.score, sub.name)}
                            </p>
                            {relevantCareers.length > 0 && (
                              <div className="flex items-start gap-1.5 pt-1">
                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground/70">Career relevance: </span>
                                  {relevantCareers.join(", ")}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default ScoreBreakdown;
