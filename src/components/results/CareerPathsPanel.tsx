import { useState, useMemo } from "react";
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
import {
  ExternalLink,
  TrendingUp,
  DollarSign,
  Briefcase,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Columns,
  LayoutGrid,
  GraduationCap,
  Lightbulb,
  Rocket,
  Clock,
  Target,
  Heart,
  MessageSquare,
} from "lucide-react";
import type { CareerRecommendation, UserProfile } from "@/utils/userProfile";
import { getCareerStrengthMap } from "@/utils/userProfile";
import ScoreGauge from "./ScoreGauge";

interface CareerPathsPanelProps {
  careers: CareerRecommendation[];
  userProfile: UserProfile | null;
  aiRoadmap?: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    fearsAddressed: string[];
  } | null;
  aiLoading?: boolean;
  aiRecommendations?: Array<{
    name: string;
    pros: string[];
    cons: string[];
    nextSteps: string[];
    layer6Match: string;
  }> | null;
}

type SortKey = "compatibility" | "salary" | "demand" | "trends" | "passion" | "accessibility";
type ViewMode = "cards" | "compare";

const CareerPathsPanel = ({
  careers,
  userProfile,
  aiRoadmap,
  aiLoading,
  aiRecommendations,
}: CareerPathsPanelProps) => {
  const [sortBy, setSortBy] = useState<SortKey>("compatibility");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const sortedCareers = useMemo(() => {
    return [...careers].sort((a, b) => {
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
          const demandOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
          return (demandOrder[b.marketDemand] || 0) - (demandOrder[a.marketDemand] || 0);
        }
        case "trends": {
          const trendOrder: Record<string, number> = { Growing: 3, Stable: 2, Declining: 1 };
          return (trendOrder[b.trends] || 0) - (trendOrder[a.trends] || 0);
        }
        case "passion": {
          return (b.passionScore || 0) - (a.passionScore || 0);
        }
        case "accessibility": {
          const accessOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
          return (accessOrder[b.accessibility] || 0) - (accessOrder[a.accessibility] || 0);
        }
        default:
          return 0;
      }
    });
  }, [careers, sortBy]);

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "High": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "";
    }
  };

  const toggleExpand = (title: string) => {
    setExpandedCards((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleCompare = (title: string) => {
    setCompareSelection((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : prev.length < 3
          ? [...prev, title]
          : prev
    );
  };

  const getAIRec = (careerTitle: string) => {
    return aiRecommendations?.find(
      (r) => r.name.toLowerCase().includes(careerTitle.toLowerCase()) ||
        careerTitle.toLowerCase().includes(r.name.toLowerCase())
    );
  };

  const comparedCareers = sortedCareers.filter((c) => compareSelection.includes(c.title));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Careers That Fit Your Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We matched your unique combination of strengths, personality, and interests to find careers where you'd naturally thrive.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none h-8 px-2"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "compare" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none h-8 px-2"
              onClick={() => setViewMode("compare")}
            >
              <Columns className="h-3.5 w-3.5" />
            </Button>
          </div>
          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[170px] h-8 text-xs">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compatibility">Best Match</SelectItem>
              <SelectItem value="salary">Highest Paying</SelectItem>
              <SelectItem value="demand">Market Demand</SelectItem>
              <SelectItem value="trends">Growth Trends</SelectItem>
              <SelectItem value="passion">Passion Fit</SelectItem>
              <SelectItem value="accessibility">Accessibility</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Comparison View ──────────────────────────────────── */}
      {viewMode === "compare" && (
        <div className="space-y-4">
          {compareSelection.length < 2 && (
            <p className="text-sm text-muted-foreground">
              Select 2-3 careers below to compare them side by side.
            </p>
          )}

          {/* Selection chips */}
          <div className="flex flex-wrap gap-2">
            {sortedCareers.map((career) => (
              <Button
                key={career.title}
                variant={compareSelection.includes(career.title) ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => toggleCompare(career.title)}
              >
                {career.title}
              </Button>
            ))}
          </div>

          {/* Comparison table */}
          {comparedCareers.length >= 2 && (
            <Card>
              <CardContent className="pt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-36">Attribute</th>
                      {comparedCareers.map((c) => (
                        <th key={c.title} className="text-left py-2 px-3 font-semibold">{c.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Compatibility</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3 font-semibold text-primary">{c.compatibilityScore}%</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Salary Range</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3">{c.salaryRange}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Market Demand</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3">
                          <Badge className={`text-xs ${getDemandColor(c.marketDemand)}`}>{c.marketDemand}</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Trend</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3">{c.trends}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Education</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3 text-xs">{c.educationRequired}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Key Skills</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {c.keySkills.slice(0, 3).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Work Style</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3 text-xs">{c.workStyle}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-muted-foreground">Accessibility</td>
                      {comparedCareers.map((c) => (
                        <td key={c.title} className="py-2.5 px-3">{c.accessibility}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── Cards View ───────────────────────────────────────── */}
      {viewMode === "cards" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCareers.map((career, idx) => {
            const isExpanded = expandedCards[career.title];
            const strengthMap = userProfile ? getCareerStrengthMap(career, userProfile) : null;
            const aiRec = getAIRec(career.title);

            return (
              <Card
                key={career.title}
                className={`relative overflow-hidden transition-shadow ${
                  idx === 0 ? "border-primary/40 shadow-md" : ""
                } ${isExpanded ? "md:col-span-2 lg:col-span-2" : ""}`}
                style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}
              >
                {idx === 0 && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                    Best Match
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                        <CardTitle className="text-lg">{career.title}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">{career.description}</p>
                    </div>
                    <ScoreGauge value={career.compatibilityScore} max={100} size="sm" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Info badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <DollarSign className="h-3 w-3" />
                      {career.salaryRange}
                    </Badge>
                    <Badge className={`gap-1 text-xs ${getDemandColor(career.marketDemand)}`}>
                      <Briefcase className="h-3 w-3" />
                      {career.marketDemand}
                    </Badge>
                    {career.trends === "Growing" && (
                      <Badge variant="outline" className="gap-1 text-xs text-green-600 dark:text-green-400">
                        <TrendingUp className="h-3 w-3" />
                        {career.trends}
                      </Badge>
                    )}
                    {career.passionScore != null && (
                      <Badge variant="outline" className="gap-1 text-xs text-rose-600 dark:text-rose-400">
                        <Heart className="h-3 w-3" />
                        Passion: {career.passionScore}%
                      </Badge>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs gap-1"
                    onClick={() => toggleExpand(career.title)}
                  >
                    {isExpanded ? "Show less" : "Learn more"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </Button>

                  {/* ─── Expanded Content ─── */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2 border-t animate-fade-in">
                      {/* Why this fits */}
                      {strengthMap && strengthMap.matching.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Why This Fits You
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {strengthMap.matching.map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI match insight */}
                      {aiRec?.layer6Match && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                          <span className="font-medium text-primary">AI Insight: </span>
                          {aiRec.layer6Match}
                        </div>
                      )}

                      {/* Skills to build */}
                      {strengthMap && strengthMap.gaps.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Skills to Build
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {strengthMap.gaps.map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Day in the life */}
                      <div>
                        <h4 className="text-sm font-medium mb-1">A Day in the Life</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{career.dayInLife}</p>
                      </div>

                      {/* Education */}
                      <div>
                        <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-blue-500" />
                          Education
                        </h4>
                        <p className="text-xs text-muted-foreground">{career.educationRequired}</p>
                      </div>

                      {/* Salary progression */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Salary Growth</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {(["entry", "mid", "senior"] as const).map((level) => (
                            <div key={level} className="p-2 rounded-lg bg-muted/50">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                {level === "entry" ? "Entry" : level === "mid" ? "Mid-Level" : "Senior"}
                              </div>
                              <div className="text-sm font-semibold">{career.salaryProgression[level]}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key skills */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Key Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {career.keySkills.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Related careers */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Related Careers</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {career.relatedCareers.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        {career.onetLink && (
                          <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                            <a href={career.onetLink} target="_blank" rel="noopener noreferrer">
                              O*NET <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Career Roadmap ───────────────────────────────────── */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Your Career Roadmap
        </h3>
        <p className="text-sm text-muted-foreground">
          A phased action plan to move from where you are to where you want to be.
        </p>

        {aiLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating your personalized roadmap...</p>
            </CardContent>
          </Card>
        ) : aiRoadmap ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border hidden sm:block" />

            <div className="space-y-4">
              {[
                { title: "Short Term", subtitle: "0-3 months", items: aiRoadmap.shortTerm, icon: <Rocket className="h-4 w-4" />, color: "bg-blue-500" },
                { title: "Medium Term", subtitle: "3-12 months", items: aiRoadmap.mediumTerm, icon: <TrendingUp className="h-4 w-4" />, color: "bg-purple-500" },
                { title: "Long Term", subtitle: "1-3 years", items: aiRoadmap.longTerm, icon: <Target className="h-4 w-4" />, color: "bg-emerald-500" },
              ].map((phase) => (
                <div key={phase.title} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full ${phase.color} text-white flex items-center justify-center shrink-0 z-10`}>
                    {phase.icon}
                  </div>
                  <Card className="flex-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {phase.title}
                        <span className="text-sm text-muted-foreground font-normal ml-2">{phase.subtitle}</span>
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
                </div>
              ))}
            </div>

            {/* Addressing concerns */}
            {aiRoadmap.fearsAddressed?.length > 0 && (
              <Card className="border-primary/20 bg-primary/5 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Addressing Your Concerns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiRoadmap.fearsAddressed.map((item, i) => (
                      <li key={i} className="text-sm text-foreground/80">{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Your personalized roadmap will appear here once AI analysis completes.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CareerPathsPanel;
