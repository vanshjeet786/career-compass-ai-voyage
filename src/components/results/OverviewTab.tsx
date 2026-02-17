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
} from "recharts";
import { Brain, TrendingUp, Lightbulb, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayerScore {
  name: string;
  score: number;
}

interface OverviewTabProps {
  overallScore: number;
  topStrengths: LayerScore[];
  growthAreas: LayerScore[];
  radarData: LayerScore[];
  onOpenAIEnhanced: () => void;
}

const OverviewTab = ({
  overallScore,
  topStrengths,
  growthAreas,
  radarData,
  onOpenAIEnhanced,
}: OverviewTabProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 dark:text-green-400";
    if (score >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 4) return "bg-green-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore ? `${overallScore}/5` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Top Strengths</div>
            <div className="text-3xl font-bold text-primary">{topStrengths.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Areas to Develop</div>
            <div className="text-3xl font-bold text-accent">{growthAreas.length}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <Button
              onClick={onOpenAIEnhanced}
              className="w-full gap-2"
              variant="default"
            >
              <Sparkles className="h-4 w-4" />
              AI Enhanced Results
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Deeper insights using all 6 layers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart + Strengths */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Strength Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            {radarData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData.slice(0, 10)}>
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

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Top Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topStrengths.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate mr-2">{item.name}</span>
                    <Badge variant="outline" className={getScoreColor(item.score)}>
                      {item.score}/5
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${getScoreBarColor(item.score)}`}
                      style={{ width: `${(item.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Development Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {growthAreas.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate mr-2">{item.name}</span>
                    <Badge variant="outline" className={getScoreColor(item.score)}>
                      {item.score}/5
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${getScoreBarColor(item.score)}`}
                      style={{ width: `${(item.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
