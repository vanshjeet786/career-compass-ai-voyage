import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, TrendingUp, DollarSign, Briefcase, ArrowUpRight } from "lucide-react";
import type { CareerRecommendation } from "@/utils/userProfile";

interface CareerPathsPanelProps {
  careers: CareerRecommendation[];
}

type SortKey = "compatibility" | "salary" | "demand" | "trends";

const CareerPathsPanel = ({ careers }: CareerPathsPanelProps) => {
  const [sortBy, setSortBy] = useState<SortKey>("compatibility");

  const sortedCareers = [...careers].sort((a, b) => {
    switch (sortBy) {
      case "compatibility":
        return b.compatibilityScore - a.compatibilityScore;
      case "salary": {
        const getSalaryMax = (range: string) => {
          const match = range.match(/\$(\d+)k/g);
          return match ? parseInt(match[match.length - 1]) : 0;
        };
        return getSalaryMax(b.salaryRange) - getSalaryMax(a.salaryRange);
      }
      case "demand": {
        const demandOrder = { High: 3, Medium: 2, Low: 1 };
        return demandOrder[b.marketDemand] - demandOrder[a.marketDemand];
      }
      case "trends": {
        const trendOrder = { Growing: 3, Stable: 2, Declining: 1 };
        return trendOrder[b.trends] - trendOrder[a.trends];
      }
      default:
        return 0;
    }
  });

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "High": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "Growing") return <TrendingUp className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Career Recommendations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Based on your Layer 1-5 quantitative scores and Layer 6 Likert responses.
          </p>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compatibility">Compatibility</SelectItem>
            <SelectItem value="salary">Salary</SelectItem>
            <SelectItem value="demand">Market Demand</SelectItem>
            <SelectItem value="trends">Growth Trends</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedCareers.slice(0, 5).map((career, idx) => (
          <Card
            key={career.title}
            className={`relative overflow-hidden ${idx === 0 ? "border-primary/40 shadow-md" : ""}`}
          >
            {idx === 0 && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                Best Match
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{career.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{career.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compatibility gauge */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Compatibility</span>
                  <span className="font-bold text-primary">{career.compatibilityScore}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-primary transition-all"
                    style={{ width: `${career.compatibilityScore}%` }}
                  />
                </div>
              </div>

              {/* Info badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  {career.salaryRange}
                </Badge>
                <Badge className={`gap-1 text-xs ${getDemandColor(career.marketDemand)}`}>
                  <Briefcase className="h-3 w-3" />
                  {career.marketDemand} Demand
                </Badge>
                {career.trends === "Growing" && (
                  <Badge variant="outline" className="gap-1 text-xs text-green-600 dark:text-green-400">
                    {getTrendIcon(career.trends)}
                    {career.trends}
                  </Badge>
                )}
              </div>

              {/* O*NET link */}
              {career.onetLink && (
                <Button variant="ghost" size="sm" className="w-full gap-2 text-xs" asChild>
                  <a href={career.onetLink} target="_blank" rel="noopener noreferrer">
                    View on O*NET
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CareerPathsPanel;
