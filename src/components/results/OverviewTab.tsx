import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Brain, TrendingUp, Lightbulb, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getScoreColor, getStrengthsNarrative, getGrowthNarrative } from "@/utils/scoreHelpers";
import { getDisplayName } from "@/utils/categoryLabels";
import ScoreGauge from "./ScoreGauge";
import type { UserProfile, CareerRecommendation } from "@/utils/userProfile";

interface LayerScore {
  name: string;
  score: number;
}

interface ComparisonDatum {
  name: string;
  base: number;
  enhanced: number;
}

interface OverviewTabProps {
  overallScore: number;
  topStrengths: LayerScore[];
  growthAreas: LayerScore[];
  radarData: LayerScore[];
  careers: CareerRecommendation[];
  comparisonData?: ComparisonDatum[];
  userProfile: UserProfile | null;
}

const OverviewTab = ({
  overallScore,
  topStrengths,
  growthAreas,
  radarData,
  careers,
  comparisonData,
  userProfile,
}: OverviewTabProps) => {
  const [showComparison, setShowComparison] = useState(false);
  const topCareer = careers[0];

  const radarSlice = radarData.slice(0, 10);
  const comparisonChartData = comparisonData?.map((d) => ({
    name: d.name.length > 18 ? d.name.slice(0, 16) + "…" : d.name,
    "Your Score": d.base,
    "AI Enhanced": d.enhanced,
  }));

  return (
    <div className="space-y-6">
      {/* ─── Insight Cards ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card 1: What Sets You Apart */}
        <Card className="lg:col-span-2 animate-fade-up shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-500" />
              What Sets You Apart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Strength bars */}
              <div className="space-y-3">
                {topStrengths.map((item, i) => {
                  const colors = getScoreColor(item.score);
                  return (
                    <div
                      key={item.name}
                      className="space-y-1.5 animate-fade-up"
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate mr-2">{getDisplayName(item.name)}</span>
                        <Badge variant="outline" className={`${colors.text} text-xs`}>
                          {item.score}/5
                        </Badge>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-3 rounded-full ${colors.bar} transition-all duration-700 ease-out`}
                          style={{ width: `${(item.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Narrative */}
              <div className="flex flex-col justify-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getStrengthsNarrative(topStrengths)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Growth Opportunities */}
        <Card className="animate-fade-up shadow-sm hover:shadow-md transition-shadow" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Growth Opportunities
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              These aren't weaknesses — they're untapped potential.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {growthAreas.map((item, i) => {
              const colors = getScoreColor(item.score);
              return (
                <div
                  key={item.name}
                  className="space-y-1.5"
                  style={{ animationDelay: `${(i + 5) * 100}ms` }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate mr-2">{getDisplayName(item.name)}</span>
                    <Badge variant="outline" className={`${colors.text} text-xs`}>
                      {item.score}/5
                    </Badge>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${colors.bar} transition-all duration-700 ease-out`}
                      style={{ width: `${(item.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              {getGrowthNarrative(growthAreas)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Top Career Match Callout ───────────────────────────── */}
      {topCareer && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <ScoreGauge value={topCareer.compatibilityScore} max={100} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-xs">
                      #1 Best Match
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mt-1">{topCareer.title}</h3>
                  <p className="text-sm text-muted-foreground">{topCareer.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-1">
                See all careers <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Radar Chart ───────────────────────────────────────── */}
      <Card className="animate-fade-up shadow-sm hover:shadow-md transition-shadow" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Strength Profile
            </CardTitle>
            {comparisonData && comparisonData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="text-xs"
              >
                {showComparison ? "Your Scores" : "AI Comparison"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-[420px]">
          {showComparison && comparisonChartData ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={comparisonChartData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                <Radar
                  name="Your Score"
                  dataKey="Your Score"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.15}
                />
                <Radar
                  name="AI Enhanced"
                  dataKey="AI Enhanced"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  strokeWidth={2}
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
          ) : radarSlice.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarSlice.map(d => {
                const label = getDisplayName(d.name);
                return {
                  ...d,
                  name: label.length > 22 ? label.slice(0, 20) + "…" : label,
                };
              })}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                <Radar
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
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
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              Complete the assessment to view your profile.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
