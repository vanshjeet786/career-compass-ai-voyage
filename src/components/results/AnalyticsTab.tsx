import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserProfile, CareerRecommendation } from "@/utils/userProfile";
import { getDisplayName } from "@/utils/categoryLabels";
import { BarChart4, Target, Briefcase, GitCommit, CheckCircle2, Clock } from "lucide-react";

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

interface AnalyticsTabProps {
  userProfile: UserProfile | null;
  careers: CareerRecommendation[];
  aiResults: AIResults | null;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))"
];

const AnalyticsTab = ({ userProfile, careers, aiResults }: AnalyticsTabProps) => {
  if (!userProfile) return null;

  // Multi-Chart Dashboard Data
  const aptitudesData = useMemo(() => {
    return Object.entries(userProfile.aptitudes)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({
        name: getDisplayName(name),
        score: Number(score.toFixed(2)),
      }))
      .slice(0, 6);
  }, [userProfile.aptitudes]);

  const personalityData = useMemo(() => {
    return Object.entries(userProfile.personalityTraits)
      .filter(([, score]) => score > 0)
      .map(([name, score]) => ({
        name: getDisplayName(name),
        value: Number(score.toFixed(2)),
      }))
      .slice(0, 5);
  }, [userProfile.personalityTraits]);

  // Deep-Dive Comparison Careers
  const top3Careers = careers.slice(0, 3);

  // Roadmap Data
  const roadmapSteps = useMemo(() => {
    if (!aiResults?.roadmap) return [];

    return [
      {
        phase: "Short-Term",
        timeframe: "0-3 Months",
        items: aiResults.roadmap.shortTerm || [],
        icon: <Target className="h-5 w-5 text-blue-500" />,
        color: "border-blue-500"
      },
      {
        phase: "Medium-Term",
        timeframe: "3-12 Months",
        items: aiResults.roadmap.mediumTerm || [],
        icon: <GitCommit className="h-5 w-5 text-amber-500" />,
        color: "border-amber-500"
      },
      {
        phase: "Long-Term",
        timeframe: "1-3 Years",
        items: aiResults.roadmap.longTerm || [],
        icon: <Briefcase className="h-5 w-5 text-green-500" />,
        color: "border-green-500"
      }
    ];
  }, [aiResults?.roadmap]);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ─── 1. Multi-Chart Analytics Dashboard ──────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart4 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">Analytics Dashboard</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Bar Chart: Top Aptitudes */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Aptitudes & Skills</CardTitle>
              <CardDescription className="text-xs">Your highest performing functional areas</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {aptitudesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aptitudesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 5]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                      width={120}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20}>
                      {aptitudesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">Not enough data</div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart: Personality Distribution */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Personality Distribution</CardTitle>
              <CardDescription className="text-xs">Relative strength of core traits</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {personalityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={personalityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {personalityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [`${value}/5`, 'Score']}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">Not enough data</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── 2. Career Match Deep-Dive Comparison Matrix ─────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">Top Matches Comparison</h2>
        </div>

        <Card className="shadow-sm overflow-hidden border-border/50">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[200px] font-semibold">Career Factor</TableHead>
                  {top3Careers.map((c, i) => (
                    <TableHead key={i} className="font-semibold text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm text-foreground">{c.title}</span>
                        <Badge variant={i === 0 ? "default" : "secondary"} className="text-[10px] uppercase">
                          {c.compatibilityScore}% Match
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Salary Range</TableCell>
                  {top3Careers.map((c, i) => (
                    <TableCell key={i} className="text-center text-sm">{c.salaryRange}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Education Required</TableCell>
                  {top3Careers.map((c, i) => (
                    <TableCell key={i} className="text-center text-sm">{c.educationRequired}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Market Demand</TableCell>
                  {top3Careers.map((c, i) => (
                    <TableCell key={i} className="text-center">
                      <Badge variant="outline" className={
                        c.marketDemand === 'High' ? 'text-green-600 border-green-200 bg-green-50/50' :
                        c.marketDemand === 'Medium' ? 'text-amber-600 border-amber-200 bg-amber-50/50' :
                        'text-red-600 border-red-200 bg-red-50/50'
                      }>
                        {c.marketDemand}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Key Skills</TableCell>
                  {top3Careers.map((c, i) => (
                    <TableCell key={i} className="text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {c.keySkills?.slice(0, 3).map((skill, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px] font-normal">{skill}</Badge>
                        )) || <span className="text-xs text-muted-foreground">N/A</span>}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-b-0">
                  <TableCell className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Strengths Used</TableCell>
                  {top3Careers.map((c, i) => (
                    <TableCell key={i} className="text-center text-xs text-muted-foreground">
                       {c.strengthsUsed?.slice(0, 2).join(", ") || "N/A"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ─── 3. Longitudinal Progress & Roadmap Visualization ────────── */}
      {roadmapSteps.length > 0 && roadmapSteps[0].items.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Career Transition Roadmap</h2>
            </div>
            {aiResults?.roadmap?.fearsAddressed && aiResults.roadmap.fearsAddressed.length > 0 && (
              <Badge variant="outline" className="bg-muted/50 hidden md:inline-flex">
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                {aiResults.roadmap.fearsAddressed[0]}
              </Badge>
            )}
          </div>

          <Card className="shadow-sm border-border/50 p-6">
            <div className="relative border-l-2 border-muted ml-3 space-y-8 py-2">
              {roadmapSteps.map((step, index) => (
                <div key={index} className="relative pl-8">
                  {/* Timeline Node */}
                  <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 bg-background flex items-center justify-center ${step.color}`}>
                    <div className={`h-2 w-2 rounded-full ${step.color.replace('border-', 'bg-')}`} />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {step.icon}
                      {step.phase}
                    </h3>
                    <Badge variant="secondary" className="w-fit mt-1 sm:mt-0 gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {step.timeframe}
                    </Badge>
                  </div>

                  <div className="grid gap-2 mt-3">
                    {step.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-muted/30 p-3 rounded-md border border-border/50 hover:bg-muted/50 transition-colors">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5 opacity-70" />
                        <span className="text-sm text-foreground/90">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
